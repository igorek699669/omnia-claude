import type { Metadata } from "next";

export { CatalogPage as default } from "@/pages/catalog";

// Каталог читает products из Payload — рендерим по запросу, а не бейкаем в билд.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Каталог",
  description:
    "Ханги ручной работы: строй, количество нот и звучание каждого инструмента. Записи реального строя, доставка СДЭК по России.",
  alternates: { canonical: "/catalog" },
};
