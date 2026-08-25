import { getPayload } from "payload";
import config from "@payload-config";
import nodemailer from "nodemailer";
import { formatPrice, CONTACT_EMAIL } from "@/shared/lib";

interface NotifyOrderDoc {
  id: number | string;
  createdAt: string;
  total: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  delivery?: {
    label?: string | null;
    address?: string | null;
    cost?: number | null;
    city?: string | null;
    pvzCode?: string | null;
  } | null;
  items: { product: { name?: string | null } | number | string | null; qty: number; price: number }[];
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  // Без таймаутов зависший SMTP (фаервол/антивирус блокирует исходящий трафик) вешает запрос навечно.
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 10_000,
});

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);
}

/**
 * Письмо продавцу об оплаченном заказе — временная замена CRM.
 *
 * Зовётся из вебхука ЮKassa после перевода заказа в "paid": до оплаты уведомлять не о чем,
 * брошенные на странице оплаты заказы засоряли бы почту. Все данные берутся из Payload,
 * а не из вебхука — тело вебхука недоверенное, и заказ к этому моменту уже сохранён.
 *
 * Бросает наружу: решение, ронять ли на этом обработку, принимает вызывающий (вебхук — не роняет).
 */
export async function sendPaidOrderEmail(orderId: number | string): Promise<void> {
  if (!process.env.SMTP_HOST) {
    console.warn(`[order-mail] SMTP не настроен — письмо по заказу ${orderId} не отправлено`);
    return;
  }

  const payload = await getPayload({ config });
  // depth: 1 — нужны названия товаров, дальше связи не разворачиваем.
  const order = (await payload.findByID({
    collection: "orders",
    id: orderId,
    depth: 1,
  })) as unknown as NotifyOrderDoc;

  const itemsTotal = order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const rows = order.items.map((item) => {
    const name = typeof item.product === "object" && item.product ? (item.product.name ?? "Товар") : "Товар";
    return { name, qty: item.qty, sum: item.price * item.qty };
  });

  const delivery = order.delivery;
  const deliveryLine = delivery?.label
    ? [delivery.label, delivery.city, delivery.address, delivery.pvzCode && `ПВЗ ${delivery.pvzCode}`]
        .filter(Boolean)
        .join(" · ")
    : "не указана";

  const lines = [
    `Заказ №${order.id}`,
    "",
    `Покупатель: ${order.customerName}`,
    `Телефон: ${order.customerPhone}`,
    `Почта: ${order.customerEmail}`,
    "",
    "Состав:",
    ...rows.map((r) => `— ${r.name} × ${r.qty} — ${formatPrice(r.sum)}`),
    "",
    `Товары: ${formatPrice(itemsTotal)}`,
    `Доставка: ${deliveryLine} — ${formatPrice(delivery?.cost ?? 0)}`,
    `Итого оплачено: ${formatPrice(order.total)}`,
    "",
    // Продавец на НПД: кассы нет, чек формируется руками в «Мой налог» и уходит покупателю.
    // Напоминание живёт в письме об оплате, потому что это единственное место, где продавец
    // гарантированно видит факт расчёта в момент, когда чек и положено выдать.
    `Чек: сформировать в «Мой налог» и отправить на ${order.customerEmail}`,
  ];

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: process.env.ORDER_NOTIFY_EMAIL ?? CONTACT_EMAIL,
    // Покупатель отвечает на письмо продавцу напрямую — reply-to избавляет от копипаста адреса.
    replyTo: order.customerEmail,
    subject: `Оплачен заказ №${order.id} — ${formatPrice(order.total)}`,
    text: lines.join("\n"),
    html: lines
      .map((line) => (line ? `<p style="margin:0 0 6px">${escapeHtml(line)}</p>` : "<br>"))
      .join(""),
  });
}
