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
 * Всё, что происходит с заказом по факту оплаты, — одним местом.
 *
 * Вынесено из вебхука ЮKassa, потому что вызывающих больше одного: тот же путь нужен
 * сверке, когда вебхук не дошёл вовсе, а заказ на самом деле оплачен. Разъезжаться этим
 * двум путям нельзя — иначе по одной ветке инструмент уедет и придут письма, а по другой нет.
 *
 * Идемпотентна: заказ в терминальном статусе возвращает "already-final" и не трогается.
 *
 * Сбои СДЭК и почты гасятся внутри: деньги приняты, остаток списан, и откатывать это из-за
 * неотправленного письма нельзя. Всё остальное бросается наружу — вызывающий решает сам
 * (вебхук отвечает ошибкой, чтобы ЮKassa повторила событие).
 */
export async function finalizePaidOrder(orderId: number | string): Promise<FinalizeResult> {
  const payload = await getPayload({ config });

  const order = (await payload.findByID({
    collection: "orders",
    id: orderId,
    depth: 0,
  })) as unknown as FinalizeOrderDoc;

  if (order.status === "paid" || order.status === "cancelled") return "already-final";

  // Остаток перепроверяем здесь, а не доверяем проверке с чекаута: между оформлением и
  // оплатой инструмент мог уехать другому покупателю. Резерв в stock.ts делает это редким,
  // но именно на этом шаге решается, есть ли товар физически.
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

  // Товара не хватило — заказ всё равно проводим, а решение оставляем продавцу. Инструменты
  // делаются руками, и покупатель, который уже заплатил, чаще готов подождать новый, чем
  // получить деньги обратно. Автоматический возврат отнял бы этот разговор; вместо него —
  // громкий лог и отдельная строка в письме продавцу.
  if (shortages.length > 0) {
    console.error(
      `[finalize] заказ ${order.id} оплачен, но товара не хватает: ${shortages.join(", ")} — свяжитесь с покупателем`,
    );
  }

  for (const item of order.items) {
    const product = products.get(String(item.product))!;
    // Ниже нуля не уходим: отрицательный остаток сломал бы витрину и все дальнейшие проверки.
    const nextQty = Math.max(0, (product.stockQty ?? 0) - item.qty);
    await payload.update({ collection: "products", id: item.product, data: { stockQty: nextQty } });
  }
  await payload.update({ collection: "orders", id: order.id, data: { status: "paid" } });

  // Дальше — то, что не должно откатывать оплату. Каждый шаг в своём try: сбой СДЭК не
  // должен лишить покупателя письма, а сбой почты — оставить заказ без отправления.
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
