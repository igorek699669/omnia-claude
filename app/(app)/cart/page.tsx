import type { Metadata } from "next";

export { CartPage as default } from "@/pages/cart";

// Личная страница без публичного содержимого — в поиске ей делать нечего.
export const metadata: Metadata = {
  title: "Корзина",
  robots: { index: false, follow: false },
};
