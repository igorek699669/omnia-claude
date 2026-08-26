import type { Metadata } from "next";

export { HomePage as default } from "@/pages/home";

// Главная показывает популярные products из Payload — рендерим по запросу, а не бейкаем в билд.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};
