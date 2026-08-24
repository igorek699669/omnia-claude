import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { getYookassaPayment } from "@/shared/lib";
import { registerCdekShipment, sendPaidOrderEmail } from "@/features/checkout/server";

interface OrderDoc {
  id: number | string;
  status: string;
  total: number;
  items: { product: number | string; qty: number }[];
}

interface ProductStockDoc {
  id: number | string;
  stockQty?: number | null;
}

export async function POST(request: Request) {
  let body: { event?: string; object?: { id?: string } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const paymentId = body.object?.id;
  if (!paymentId || !body.event) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  // ЮKassa не подписывает вебхуки (нет HMAC) — телу запроса не доверяем в принципе.
  // Единственный источник правды — перезапросить платёж по id своим секретным ключом.
  let payment;
  try {
    payment = await getYookassaPayment(paymentId);
  } catch {
    return NextResponse.json({ error: "failed to verify payment" }, { status: 502 });
  }

  const payload = await getPayload({ config });
  const found = await payload.find({
    collection: "orders",
    where: { paymentId: { equals: payment.id } },
    limit: 1,
    depth: 0,
  });
  const order = found.docs[0] as OrderDoc | undefined;
  if (!order) {
    return NextResponse.json({ ok: true });
  }

  // Заказ уже в терминальном статусе — повторная доставка того же события ЮKassa не должна
  // ничего менять (идемпотентность).
  if (order.status === "paid" || order.status === "cancelled") {
    return NextResponse.json({ ok: true });
  }

  if (payment.status === "succeeded") {
    const expected = Number(order.total).toFixed(2);
    if (payment.amount.value !== expected) {
      return NextResponse.json({ error: "amount mismatch" }, { status: 400 });
    }
    for (const item of order.items) {
      const product = (await payload.findByID({
        collection: "products",
        id: item.product,
      })) as ProductStockDoc;
      const nextQty = Math.max(0, (product.stockQty ?? 0) - item.qty);
      await payload.update({ collection: "products", id: item.product, data: { stockQty: nextQty } });
    }
    await payload.update({ collection: "orders", id: order.id, data: { status: "paid" } });

    // Сбой на стороне СДЭК не должен ронять обработку вебхука: деньги уже приняты, остаток
    // списан, заказ оплачен — ответь мы ошибкой, ЮKassa начала бы ретраить событие и
    // прогонять всё это заново. Отправление в этом случае придётся завести вручную.
    try {
      await registerCdekShipment(order.id);
    } catch (err) {
      console.error(`[cdek] не удалось зарегистрировать отправление по заказу ${order.id}:`, err);
    }

    // Уведомление продавцу (пока нет CRM) — по той же причине не роняет вебхук: заказ уже
    // оплачен и лежит в Payload, письмо всего лишь дублирует его на почту.
    try {
      await sendPaidOrderEmail(order.id);
    } catch (err) {
      console.error(`[order-mail] не удалось отправить письмо по заказу ${order.id}:`, err);
    }
  } else if (payment.status === "canceled") {
    await payload.update({ collection: "orders", id: order.id, data: { status: "cancelled" } });
  }

  return NextResponse.json({ ok: true });
}
