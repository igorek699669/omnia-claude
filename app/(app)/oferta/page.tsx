import type { Metadata } from "next";

export { OfertaPage as default } from "@/pages/oferta";

export const metadata: Metadata = {
  title: "Публичная оферта",
  description: "Условия договора розничной купли-продажи инструментов Omnia: цена, оплата, доставка, ответственность сторон.",
  alternates: { canonical: "/oferta" },
};
