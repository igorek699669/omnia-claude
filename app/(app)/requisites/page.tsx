import type { Metadata } from "next";

export { RequisitesPage as default } from "@/pages/requisites";

export const metadata: Metadata = {
  title: "Контакты и реквизиты",
  description: "Реквизиты продавца, телефон, почта, режим работы и адрес для претензий.",
  alternates: { canonical: "/requisites" },
};
