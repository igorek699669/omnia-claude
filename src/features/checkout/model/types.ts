import { z } from "zod";

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
    email: z.string().email(),
    phone: z.string().min(1),
  }),
  delivery: z.object({
    label: z.string().min(1),
    cost: z.number().min(0),
  }),
});

export type CheckoutInput = z.infer<typeof checkoutInputSchema>;

export type CheckoutResult = { confirmationUrl: string } | { error: string };
