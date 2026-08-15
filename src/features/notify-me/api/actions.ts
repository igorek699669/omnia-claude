"use server";

import { getPayload } from "payload";
import config from "@payload-config";
import { z } from "zod";

const inputSchema = z.object({
  productId: z.string().min(1),
  email: z.email(),
});

export async function subscribeToRestock(
  productId: string,
  email: string,
): Promise<{ ok: true } | { error: string }> {
  const parsed = inputSchema.safeParse({ productId, email });
  if (!parsed.success) {
    return { error: "Введите корректную почту" };
  }

  try {
    const payload = await getPayload({ config });

    // С клиента id приходит строкой (Product.id — string), а в Postgres он числовой.
    // Валидация relationship в Payload строку не приводит к числу и роняет create,
    // поэтому берём нативный id из самого документа — заодно проверяем, что товар есть.
    let product: { id: number | string };
    try {
      product = await payload.findByID({
        collection: "products",
        id: parsed.data.productId,
        depth: 0,
      });
    } catch {
      return { error: "Инструмент не найден" };
    }

    const existing = await payload.find({
      collection: "stock-subscriptions",
      where: {
        product: { equals: product.id },
        email: { equals: parsed.data.email },
        notifiedAt: { exists: false },
      },
      limit: 1,
    });
    if (existing.docs.length > 0) {
      return { ok: true };
    }

    await payload.create({
      collection: "stock-subscriptions",
      data: { product: product.id, email: parsed.data.email },
    });

    return { ok: true };
  } catch (err) {
    console.error("[subscribeToRestock] не удалось оформить подписку:", err);
    return { error: "Не получилось оформить подписку — попробуйте ещё раз" };
  }
}
