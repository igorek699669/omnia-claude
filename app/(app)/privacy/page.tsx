import type { Metadata } from "next";

export { PrivacyPage as default } from "@/pages/privacy";

export const metadata: Metadata = {
  title: "Политика персональных данных",
  description: "Какие данные обрабатывает Omnia, зачем, на каком основании и как их удалить. По ФЗ №152-ФЗ.",
  alternates: { canonical: "/privacy" },
};
