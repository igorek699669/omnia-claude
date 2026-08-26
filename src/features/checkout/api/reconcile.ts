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
}

/**
 * Не чаще одного обращения к ЮKassa на заказ за этот интервал. Профиль опрашивает себя
 * раз в 10 секунд, пока оплата не закрыта, и без этого каждый такой тик уходил бы в их API.
 */
const MIN_GAP_MS = 20_000;

/**
 * Сколько ещё ждём накладную от СДЭК. Обычно она присваивается за часы, но на тестовом
 * контуре не приходит вовсе — без верхней границы такой заказ дёргал бы СДЭК на каждый
 * заход в личный кабинет до скончания веков.
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
 * Досинхронизация накладной СДЭК.
 *
 * Номер присваивается асинхронно, уже после регистрации отправления: разовая попытка в
 * registerCdekShipment почти всегда возвращает пусто, и без этого места в личном кабинете
 * навсегда оставалось бы «формируется, появится в течение дня».
 *
 * Как только номер узнан впервые — уходит письмо покупателю: в подтверждении заказа ему
 * обещано, что трек появится, и обещание должно закрываться само, а не проверкой кабинета.
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
 * Приведение заказов покупателя в соответствие с тем, что на самом деле происходит снаружи:
 * оплата в ЮKassa и накладная в СДЭК. И то и другое приходит асинхронно и может не дойти.
 *
 * Зачем: заказ переводит в «Оплачен» вебхук, а он может не дойти — не настроен, отбит
 * фаерволом, упал. Тогда деньги списаны, а заказ навсегда остаётся pending: инструмент не
 * уедет, писем не будет, и в личном кабинете покупатель видит «Ожидает оплаты». Никакое
 * обновление страницы это не чинит, потому что неверны сами данные, — нужно спросить у
 * ЮKassa, что там на самом деле, и провести ту же финализацию.
 *
 * Зовётся из профиля, то есть под сессией и только по своим заказам: в открытый
 * getOrderStatus такое ставить нельзя — он и так отдаёт чужой заказ по номеру (пункт 13).
 *
 * Никогда не бросает: профиль должен открыться даже если ЮKassa недоступна.
 */
export async function reconcileCustomerOrders(customerId: string, now = Date.now()): Promise<void> {
  forget(now);

  try {
    const payload = await getPayload({ config });
    const cutoff = new Date(now - PAYMENT_SETTLE_WINDOW_MS).toISOString();

    // Только незакрытые и недавние: висящий третьи сутки pending — брошенная корзина,
    // дёргать по нему платёжный API на каждый заход в профиль незачем.
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
        const payment = await getYookassaPayment(doc.paymentId);
        if (payment.status === "succeeded") {
          // Сумму сверяем и здесь: путь тот же, что у вебхука, и проверка не должна
          // существовать только в одной из двух веток.
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
