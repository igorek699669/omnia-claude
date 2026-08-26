import type { Metadata } from "next";

export { ProfilePage as default } from "@/pages/profile";

// Личная страница без публичного содержимого — в поиске ей делать нечего.
export const metadata: Metadata = {
  title: "Личный кабинет",
  robots: { index: false, follow: false },
};
