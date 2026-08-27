import type { Metadata } from "next";
import { CheckoutSuccessPage } from "@/pages/checkout-success";

export const metadata: Metadata = {
  title: "Оплата заказа",
  robots: { index: false, follow: false },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) {
  const { orderId } = await searchParams;
  return <CheckoutSuccessPage orderId={orderId} />;
}
