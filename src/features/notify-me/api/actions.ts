"use server";

import { getPayload } from "payload";
import config from "@payload-config";
import { z } from "zod";

const inputSchema = z.object({
  productId: z.string().min(1),
  email: z.string().email(),
});

export async function subscribeToRestock(
  productId: string,
  email: string,
): Promise<{ ok: true } | { error: string }> {
  const parsed = inputSchema.safeParse({ productId, email });
  if (!parsed.success) {
    return { error: "Введите корректную почту" };
  }

  const payload = await getPayload({ config });

  const existing = await payload.find({
    collection: "stock-subscriptions",
    where: {
      product: { equals: parsed.data.productId },
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
    data: { product: parsed.data.productId, email: parsed.data.email },
  });

  return { ok: true };
}
