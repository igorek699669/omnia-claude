import "server-only";
import { getPayload } from "payload";
import config from "@payload-config";
import { getYookassaPayment } from "@/shared/lib";
import { PAYMENT_SETTLE_WINDOW_MS } from "@/entities/order";
import { finalizePaidOrder } from "./finalize";
import { syncCdekOrderNumber } from "./shipment";
import { sendTrackNumberEmail } from "./order-mail";

interface PendingOrderDoc {
  id: number | string;
  total: number;
  paymentId?: string | null;
  /** Платёж заведён в тестовом магазине — проверять его надо тестовыми ключами. */
  testPayment?: boolean | null;
}

/** Не чаще одного обращения к ЮKassa на заказ: профиль опрашивает себя раз в 10 секунд. */
const MIN_GAP_MS = 20_000;

/**
 * Сколько ещё ждём накладную. Обычно она приходит за часы, но на тестовом контуре не
 * приходит вовсе — без границы такой заказ дёргал бы СДЭК на каждый заход в кабинет.
 */
const TRACK_SYNC_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

const lastCheckedAt = new Map<string, number>();

function forget(now: number): void {
  for (const [key, at] of lastCheckedAt) {
    if (now - at >= PAYMENT_SETTLE_WINDOW_MS) lastCheckedAt.delete(key);
  }
}

/** true — по этому ключу можно идти во внешний сервис, промежуток выдержан. */
function takeSlot(key: string, now: number): boolean {
  if (now - (lastCheckedAt.get(key) ?? 0) < MIN_GAP_MS) return false;
  lastCheckedAt.set(key, now);
  return true;
}

interface TrackedOrderDoc {
  id: number | string;
}

/**
 * Досинхронизация накладной. Номер присваивается асинхронно: разовая попытка в
 * registerCdekShipment почти всегда возвращает пусто, и в кабинете навсегда оставалось бы
 * «формируется». Как только номер узнан впервые — уходит письмо: в подтверждении заказа
 * покупателю обещано, что трек появится.
 */
async function syncTrackNumbers(
  payload: Awaited<ReturnType<typeof getPayload>>,
  customerId: string,
  now: number,
): Promise<void> {
  const cutoff = new Date(now - TRACK_SYNC_MAX_AGE_MS).toISOString();

  const awaiting = await payload.find({
    collection: "orders",
    where: {
      and: [
        { customerId: { equals: customerId } },
        { status: { in: ["paid", "shipped"] } },
        { cdekUuid: { exists: true } },
        { cdekNumber: { exists: false } },
        { createdAt: { greater_than: cutoff } },
      ],
    },
    limit: 10,
    depth: 0,
  });

  for (const doc of awaiting.docs as unknown as TrackedOrderDoc[]) {
    if (!takeSlot(`track:${doc.id}`, now)) continue;
    try {
      // Выборка идёт по заказам без номера, поэтому непустой ответ — это всегда новый номер.
      const cdekNumber = await syncCdekOrderNumber(doc.id);
      if (!cdekNumber) continue;
      await sendTrackNumberEmail(doc.id);
    } catch (err) {
      console.error(`[reconcile] не удалось подтянуть накладную по заказу ${doc.id}:`, err);
    }
  }
}

/**
 * Приведение заказов покупателя в соответствие с внешним миром: оплата в ЮKassa и накладная
 * в СДЭК приходят асинхронно и могут не дойти. Вебхук мог не дойти вовсе — тогда деньги
 * списаны, а заказ навсегда pending: инструмент не уедет, писем не будет, и в кабинете
 * висит «Ожидает оплаты». Обновление страницы это не чинит — нужно спросить у ЮKassa.
 *
 * Зовётся из профиля, под сессией и только по своим заказам: в открытый getOrderStatus
 * такое ставить нельзя. Не бросает — профиль должен открыться и при недоступной ЮKassa.
 */
export async function reconcileCustomerOrders(customerId: string, now = Date.now()): Promise<void> {
  forget(now);

  try {
    const payload = await getPayload({ config });
    const cutoff = new Date(now - PAYMENT_SETTLE_WINDOW_MS).toISOString();

    const pending = await payload.find({
      collection: "orders",
      where: {
        and: [
          { customerId: { equals: customerId } },
          { status: { equals: "pending" } },
          { createdAt: { greater_than: cutoff } },
        ],
      },
      limit: 10,
      depth: 0,
    });

    for (const doc of pending.docs as unknown as PendingOrderDoc[]) {
      if (!doc.paymentId) continue;

      if (!takeSlot(`payment:${doc.id}`, now)) continue;

      try {
        const payment = await getYookassaPayment(doc.paymentId, Boolean(doc.testPayment));
        if (payment.status === "succeeded") {
          // Сумму сверяем и здесь: проверка не должна жить только в одной из двух веток.
          if (payment.amount.value !== Number(doc.total).toFixed(2)) {
            console.error(`[reconcile] заказ ${doc.id}: сумма платежа не совпадает с заказом`);
            continue;
          }
          console.warn(`[reconcile] заказ ${doc.id} оплачен, но вебхук не дошёл — финализируем сами`);
          await finalizePaidOrder(doc.id);
        } else if (payment.status === "canceled") {
          await payload.update({ collection: "orders", id: doc.id, data: { status: "cancelled" } });
        }
      } catch (err) {
        console.error(`[reconcile] не удалось сверить заказ ${doc.id} с ЮKassa:`, err);
      }
    }

    // Вторая половина «несвежих данных» в кабинете: оплаченный заказ без накладной.
    await syncTrackNumbers(payload, customerId, now);
  } catch (err) {
    console.error(`[reconcile] сверка заказов покупателя ${customerId} не выполнена:`, err);
  }
}
