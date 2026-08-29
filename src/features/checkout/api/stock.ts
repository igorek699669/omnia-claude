import "server-only";
import type { Payload } from "payload";
import { PAYMENT_SETTLE_WINDOW_MS } from "@/entities/order";

interface PendingOrderDoc {
  items: { product: number | string; qty: number }[];
}

/**
 * Сколько единиц каждого товара занято незакрытыми заказами (ключ — id товара строкой).
 *
 * Резерв — не отдельное поле, а следствие статуса и возраста заказа: недавний pending ещё
 * может быть оплачен, и его инструмент нельзя предлагать второму покупателю; более старый —
 * брошенная корзина, она ничего не держит. Поля reservedUntil нет намеренно: оно означало бы
 * миграцию схемы Payload, а окно и так выводится из createdAt.
 *
 * Это защита от совпадения, а не от гонки в миллисекунды: настоящую ловит уже
 * finalizePaidOrder, перепроверяя остаток в момент оплаты.
 */
export async function reservedQtyByProduct(payload: Payload, now = Date.now()): Promise<Map<string, number>> {
  const cutoff = new Date(now - PAYMENT_SETTLE_WINDOW_MS).toISOString();

  const pending = await payload.find({
    collection: "orders",
    where: {
      and: [{ status: { equals: "pending" } }, { createdAt: { greater_than: cutoff } }],
    },
    limit: 200,
    depth: 0,
  });

  const reserved = new Map<string, number>();
  for (const doc of pending.docs as unknown as PendingOrderDoc[]) {
    for (const item of doc.items) {
      const key = String(item.product);
      reserved.set(key, (reserved.get(key) ?? 0) + item.qty);
    }
  }
  return reserved;
}
