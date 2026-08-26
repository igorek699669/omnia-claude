import type { Metadata } from "next";

export { AuthPage as default } from "@/pages/auth";

// Личная страница без публичного содержимого — в поиске ей делать нечего.
export const metadata: Metadata = {
  title: "Вход",
  robots: { index: false, follow: false },
};
