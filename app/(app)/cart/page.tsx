import type { Metadata } from "next";

export { CartPage as default } from "@/pages/cart";

export const metadata: Metadata = {
  title: "Корзина",
  robots: { index: false, follow: false },
};
