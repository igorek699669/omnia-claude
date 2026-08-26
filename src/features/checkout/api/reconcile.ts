import "server-only";
import { getPayload } from "payload";
import config from "@payload-config";
import { getYookassaPayment } from "@/shared/lib";
import { PAYMENT_SETTLE_WINDOW_MS } from "@/entities/order";
import { finalizePaidOrder } from "./finalize";

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

const lastCheckedAt = new Map<string, number>();

function forget(now: number): void {
  for (const [key, at] of lastCheckedAt) {
    if (now - at >= PAYMENT_SETTLE_WINDOW_MS) lastCheckedAt.delete(key);
  }
}

/**
 * Досверка заказов покупателя с ЮKassa.
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

      const key = String(doc.id);
      if (now - (lastCheckedAt.get(key) ?? 0) < MIN_GAP_MS) continue;
      lastCheckedAt.set(key, now);

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
  } catch (err) {
    console.error(`[reconcile] сверка заказов покупателя ${customerId} не выполнена:`, err);
  }
}
