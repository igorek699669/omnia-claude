import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { getYookassaPayment } from "@/shared/lib";
import { finalizePaidOrder } from "@/features/checkout/server";

interface OrderDoc {
  id: number | string;
  status: string;
  total: number;
  testPayment?: boolean | null;
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

  // Заказ ищем раньше проверки платежа, но ничего по нему пока не решаем: он нужен только
  // затем, чтобы знать, каким магазином ЮKassa проверять платёж — боевым или тестовым
  // (чекбокс «тестовая оплата» у товара; тестовый про боевой платёж не знает). Из тела при
  // этом берётся только id как ключ поиска — статусу и сумме оттуда веры нет.
  const payload = await getPayload({ config });
  const found = await payload.find({
    collection: "orders",
    where: { paymentId: { equals: paymentId } },
    limit: 1,
    depth: 0,
  });
  const order = found.docs[0] as OrderDoc | undefined;

  // ЮKassa не подписывает вебхуки (нет HMAC) — телу запроса не доверяем в принципе.
  // Единственный источник правды — перезапросить платёж по id своим секретным ключом.
  // Заказа под этот id может не быть вовсе: спрашиваем всё равно и боевыми ключами —
  // выдуманный снаружи id обязан упереться в кассу, а не тихо получить «ок».
  let payment;
  try {
    payment = await getYookassaPayment(paymentId, Boolean(order?.testPayment));
  } catch {
    return NextResponse.json({ error: "failed to verify payment" }, { status: 502 });
  }

  if (!order) {
    return NextResponse.json({ ok: true });
  }

  if (payment.status === "succeeded") {
    const expected = Number(order.total).toFixed(2);
    if (payment.amount.value !== expected) {
      return NextResponse.json({ error: "amount mismatch" }, { status: 400 });
    }

    // Всё остальное — в finalizePaidOrder: тот же путь нужен сверке, когда вебхук не дошёл,
    // и разъезжаться им нельзя. Идемпотентность там же.
    try {
      await finalizePaidOrder(order.id);
    } catch (err) {
      // Отвечаем ошибкой сознательно: пусть ЮKassa повторит — терминальный заказ повтор
      // не тронет, а недоведённый доведёт.
      console.error(`[webhook] не удалось финализировать заказ ${order.id}:`, err);
      return NextResponse.json({ error: "finalization failed" }, { status: 502 });
    }
  } else if (payment.status === "canceled") {
    // Оплаченный заказ не отменяем: у ЮKassa это разные платежи, а у нас один заказ.
    if (order.status === "pending") {
      await payload.update({ collection: "orders", id: order.id, data: { status: "cancelled" } });
    }
  }

  return NextResponse.json({ ok: true });
}
