import type { Metadata } from "next";

export { DeliveryPage as default } from "@/pages/delivery";

export const metadata: Metadata = {
  title: "Доставка и оплата",
  description:
    "Как мы упаковываем и отправляем инструменты: СДЭК до пункта выдачи или курьером, сроки, оплата картой, отслеживание.",
  alternates: { canonical: "/delivery" },
};
