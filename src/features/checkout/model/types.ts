import { z } from "zod";
import { DELIVERY_PROVIDERS, DELIVERY_TYPES } from "@/shared/lib";

export const checkoutInputSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        qty: z.number().int().min(1),
      }),
    )
    .min(1),
  customer: z.object({
    lastName: z.string().min(1),
    firstName: z.string().min(1),
    email: z.email(),
    phone: z.string().min(1),
  }),
  delivery: z.object({
    provider: z.enum(DELIVERY_PROVIDERS),
    type: z.enum(DELIVERY_TYPES),
    label: z.string().min(1),
    address: z.string().min(1),
    cost: z.number().min(0),
    pvzCode: z.string().optional(),
    // Нужны после оплаты, при регистрации отправления (см. api/shipment).
    city: z.string().min(1),
    cityCode: z.number().int().positive(),
    tariffCode: z.number().int().positive(),
  }),
});

export type CheckoutInput = z.infer<typeof checkoutInputSchema>;

export type CheckoutResult = { confirmationUrl: string } | { error: string };
