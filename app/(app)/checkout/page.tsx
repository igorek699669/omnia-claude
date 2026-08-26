import type { Metadata } from "next";

export { CheckoutPage as default } from "@/pages/checkout";

// Личная страница без публичного содержимого — в поиске ей делать нечего.
export const metadata: Metadata = {
  title: "Оформление заказа",
  robots: { index: false, follow: false },
};
