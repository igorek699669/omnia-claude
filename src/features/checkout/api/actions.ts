"use server";

import { headers } from "next/headers";
import { getPayload } from "payload";
import config from "@payload-config";
import { auth } from "@/auth";
import { checkoutInputSchema, type CheckoutInput, type CheckoutResult } from "../model/types";
import { createYookassaPayment } from "@/shared/lib";

interface ProductDoc {
  id: number | string;
  name: string;
  price: number;
  inStock?: boolean | null;
}

interface OrderDoc {
  id: number | string;
  status: string;
  total: number;
  items: { product: number | string; qty: number }[];
}

export async function createOrderPayment(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = checkoutInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Некорректные данные заказа" };
  }
  const { items, customer, delivery } = parsed.data;

  const payload = await getPayload({ config });

  // Цену и наличие всегда берём из Payload — клиентским данным (localStorage-корзина) не доверяем.
  const orderItems: { product: string | number; qty: number; price: number }[] = [];
  let subtotal = 0;
  for (const item of items) {
    let doc: ProductDoc | null = null;
    try {
      doc = (await payload.findByID({ collection: "products", id: item.productId })) as ProductDoc;
    } catch {
      doc = null;
    }
    if (!doc || doc.inStock === false) {
      return { error: `Товар «${doc?.name ?? item.productId}» больше недоступен` };
    }
    orderItems.push({ product: doc.id, qty: item.qty, price: doc.price });
    subtotal += doc.price * item.qty;
  }

  const total = subtotal + delivery.cost;

  let customerId: string | undefined;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    customerId = session?.user?.id;
  } catch {
    // сессии нет — оформляем гостевой заказ
  }

  const order = (await payload.create({
    collection: "orders",
    data: {
      customerId,
      customerName: `${customer.firstName} ${customer.lastName}`.trim(),
      customerEmail: customer.email,
      customerPhone: customer.phone,
      delivery,
      items: orderItems,
      total,
      status: "pending",
    },
  })) as OrderDoc;

  const siteUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

  try {
    const payment = await createYookassaPayment({
      idempotenceKey: String(order.id),
      amount: total,
      description: `Заказ №${order.id} — Omnia`,
      returnUrl: `${siteUrl}/checkout/success?orderId=${order.id}`,
      metadata: { orderId: String(order.id) },
    });

    await payload.update({ collection: "orders", id: order.id, data: { paymentId: payment.id } });

    if (!payment.confirmation?.confirmation_url) {
      return { error: "ЮKassa не вернула ссылку на оплату" };
    }
    return { confirmationUrl: payment.confirmation.confirmation_url };
  } catch {
    await payload.update({ collection: "orders", id: order.id, data: { status: "cancelled" } });
    return { error: "Не удалось создать платёж. Попробуйте ещё раз." };
  }
}

export async function getOrderStatus(
  orderId: string,
): Promise<{ status: string; total: number; productIds: string[] } | null> {
  const payload = await getPayload({ config });
  try {
    // depth: 0 — товары в items нужны только как id, не как раскрытые документы.
    const order = (await payload.findByID({ collection: "orders", id: orderId, depth: 0 })) as OrderDoc;
    return {
      status: order.status,
      total: order.total,
      productIds: order.items.map((item) => String(item.product)),
    };
  } catch {
    return null;
  }
}
