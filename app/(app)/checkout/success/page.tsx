import { CheckoutSuccessPage } from "@/pages/checkout-success";

export default async function Page({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) {
  const { orderId } = await searchParams;
  return <CheckoutSuccessPage orderId={orderId} />;
}
