import type { Metadata } from "next";

export { TermsPage as default } from "@/pages/terms";

export const metadata: Metadata = {
  title: "Пользовательское соглашение",
  description: "Правила использования сайта Omnia.",
  alternates: { canonical: "/terms" },
};
