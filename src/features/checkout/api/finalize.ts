import "server-only";
import { getPayload } from "payload";
import config from "@payload-config";
import { registerCdekShipment } from "./shipment";
import { sendPaidOrderEmail, sendCustomerOrderEmail } from "./order-mail";

interface FinalizeOrderDoc {
  id: number | string;
  status: string;
  total: number;
  items: { product: number | string; qty: number }[];
}

interface ProductStockDoc {
  id: number | string;
  name?: string | null;
  stockQty?: number | null;
}

export type FinalizeResult =
  /** Заказ переведён в «Оплачен», остаток списан, отправление и письма запущены. */
  | "finalized"
  /** Уже paid или cancelled — повторный вызов ничего не менял. */
  | "already-final";

/**
 * Всё, что происходит с заказом по факту оплаты, — одним местом. Вынесено из вебхука ЮKassa,
 * потому что вызывающих больше одного: тот же путь нужен сверке, когда вебхук не дошёл. Этим
 * двум путям нельзя разъезжаться — иначе по одной ветке инструмент уедет и придут письма,
 * а по другой нет.
 *
 * Идемпотентна: заказ в терминальном статусе возвращает "already-final". Сбои СДЭК и почты
 * гасятся внутри — деньги приняты и остаток списан, откатывать это из-за письма нельзя;
 * остальное бросается наружу (вебхук отвечает ошибкой, чтобы ЮKassa повторила событие).
 */
export async function finalizePaidOrder(orderId: number | string): Promise<FinalizeResult> {
  const payload = await getPayload({ config });

  const order = (await payload.findByID({
    collection: "orders",
    id: orderId,
    depth: 0,
  })) as unknown as FinalizeOrderDoc;

  if (order.status === "paid" || order.status === "cancelled") return "already-final";

  const products = new Map<string, ProductStockDoc>();
  const shortages: string[] = [];
  for (const item of order.items) {
    const product = (await payload.findByID({
      collection: "products",
      id: item.product,
    })) as ProductStockDoc;
    products.set(String(item.product), product);
    if ((product.stockQty ?? 0) < item.qty) {
      shortages.push(product.name ?? String(item.product));
    }
  }

  for (const item of order.items) {
    const product = products.get(String(item.product))!;
    const nextQty = Math.max(0, (product.stockQty ?? 0) - item.qty);
    await payload.update({ collection: "products", id: item.product, data: { stockQty: nextQty } });
  }
  await payload.update({ collection: "orders", id: order.id, data: { status: "paid" } });

  try {
    await registerCdekShipment(order.id);
  } catch (err) {
    console.error(`[cdek] не удалось зарегистрировать отправление по заказу ${order.id}:`, err);
  }

  try {
    await sendPaidOrderEmail(order.id, { shortages });
  } catch (err) {
    console.error(`[order-mail] не удалось отправить письмо продавцу по заказу ${order.id}:`, err);
  }

  try {
    await sendCustomerOrderEmail(order.id);
  } catch (err) {
    console.error(`[order-mail] не удалось отправить письмо покупателю по заказу ${order.id}:`, err);
  }

  return "finalized";
}
