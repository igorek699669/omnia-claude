import type { Metadata } from "next";

export { CheckoutPage as default } from "@/pages/checkout";

export const metadata: Metadata = {
  title: "Оформление заказа",
  robots: { index: false, follow: false },
};
