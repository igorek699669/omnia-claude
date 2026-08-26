import { getPayload } from "payload";
import config from "@payload-config";
import nodemailer from "nodemailer";
import { formatPrice, formatDate, CONTACT_EMAIL, CONTACT_PHONE } from "@/shared/lib";

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
 * Один и тот же текст письма уходит и plain text, и HTML: почтовые клиенты выбирают сами.
 * Ссылки в HTML-версии делаем кликабельными — иначе покупатель не дойдёт до личного кабинета.
 */
function toHtml(lines: string[]): string {
  return lines
    .map((line) => {
      if (!line) return "<br>";
      const escaped = escapeHtml(line).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>');
      return `<p style="margin:0 0 6px">${escaped}</p>`;
    })
    .join("");
}

/** Адрес продавца для уведомлений и для ответов покупателя. */
function sellerEmail(): string {
  return process.env.ORDER_NOTIFY_EMAIL ?? CONTACT_EMAIL;
}

interface OrderSummary {
  order: NotifyOrderDoc;
  itemsTotal: number;
  rows: { name: string; qty: number; sum: number }[];
  deliveryLine: string;
}

/**
 * Заказ и его состав в том виде, в каком его показывают оба письма. Данные берутся из
 * Payload, а не из вебхука: тело вебхука недоверенное, и заказ к этому моменту уже сохранён.
 */
async function loadOrderSummary(orderId: number | string): Promise<OrderSummary> {
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

  return { order, itemsTotal, rows, deliveryLine };
}

/**
 * Письмо продавцу об оплаченном заказе — временная замена CRM.
 *
 * Зовётся из вебхука ЮKassa после перевода заказа в "paid": до оплаты уведомлять не о чем,
 * брошенные на странице оплаты заказы засоряли бы почту.
 *
 * Бросает наружу: решение, ронять ли на этом обработку, принимает вызывающий (вебхук — не роняет).
 */
export async function sendPaidOrderEmail(orderId: number | string): Promise<void> {
  if (!process.env.SMTP_HOST) {
    console.warn(`[order-mail] SMTP не настроен — письмо продавцу по заказу ${orderId} не отправлено`);
    return;
  }

  const { order, itemsTotal, rows, deliveryLine } = await loadOrderSummary(orderId);

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
    `Доставка: ${deliveryLine} — ${formatPrice(order.delivery?.cost ?? 0)}`,
    `Итого оплачено: ${formatPrice(order.total)}`,
    "",
    // Продавец на НПД: кассы нет, чек формируется руками в «Мой налог» и уходит покупателю.
    // Напоминание живёт в письме об оплате, потому что это единственное место, где продавец
    // гарантированно видит факт расчёта в момент, когда чек и положено выдать.
    `Чек: сформировать в «Мой налог» и отправить на ${order.customerEmail}`,
  ];

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: sellerEmail(),
    // Покупатель отвечает на письмо продавцу напрямую — reply-to избавляет от копипаста адреса.
    replyTo: order.customerEmail,
    subject: `Оплачен заказ №${order.id} — ${formatPrice(order.total)}`,
    text: lines.join("\n"),
    html: toHtml(lines),
  });
}

/**
 * Подтверждение заказа покупателю — то единственное, что остаётся у него на руках после оплаты.
 *
 * Зовётся из того же вебхука, что и письмо продавцу, и так же не должно ронять обработку:
 * деньги уже приняты, заказ сохранён, а неотправленное письмо чинится повторной отправкой.
 *
 * Про чек сказано отдельно и намеренно: продавец на НПД пробивает его руками в «Мой налог»
 * (см. п. 4 оферты), так что чек придёт не сразу и не этим письмом — без объяснения покупатель
 * решит, что его забыли.
 */
export async function sendCustomerOrderEmail(orderId: number | string): Promise<void> {
  if (!process.env.SMTP_HOST) {
    console.warn(`[order-mail] SMTP не настроен — письмо покупателю по заказу ${orderId} не отправлено`);
    return;
  }

  const { order, itemsTotal, rows, deliveryLine } = await loadOrderSummary(orderId);
  const siteUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

  const lines = [
    `${order.customerName}, спасибо за заказ!`,
    "",
    `Заказ №${order.id} от ${formatDate(order.createdAt)} оплачен.`,
    "",
    "Состав:",
    ...rows.map((r) => `— ${r.name} × ${r.qty} — ${formatPrice(r.sum)}`),
    "",
    `Товары: ${formatPrice(itemsTotal)}`,
    `Доставка: ${deliveryLine} — ${formatPrice(order.delivery?.cost ?? 0)}`,
    `Итого оплачено: ${formatPrice(order.total)}`,
    "",
    "Что дальше",
    "Мы упакуем инструмент в чехол и короб с ложементом и передадим в СДЭК.",
    `Статус заказа и трек-номер появятся в личном кабинете: ${siteUrl}/profile`,
    "Чек пришлём отдельным письмом — он формируется в приложении «Мой налог».",
    "",
    `Если нужно что-то уточнить — ответьте на это письмо или напишите: ${sellerEmail()}, ${CONTACT_PHONE}`,
  ];

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: order.customerEmail,
    // Ответ покупателя должен уходить продавцу, а не в noreply-ящик из SMTP_FROM.
    replyTo: sellerEmail(),
    subject: `Заказ №${order.id} оплачен — Omnia`,
    text: lines.join("\n"),
    html: toHtml(lines),
  });
}
