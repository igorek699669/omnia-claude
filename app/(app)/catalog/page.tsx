import type { Metadata } from "next";

export { CatalogPage as default } from "@/pages/catalog";

// Каталог читает products из Payload — рендерим по запросу, а не бейкаем в билд.
export const dynamic = "force-dynamic";


export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { page: raw } = await searchParams;
  const page = Math.max(1, Number(raw) || 1);

  return {
    // absolute: шаблон layout добавил бы « — Omnia» к строке, где имя уже есть.
    title: {
      absolute:
        page > 1
          ? `Ханг купить — хэндпан ручной работы, страница ${page}`
          : "Ханг купить — хэндпан ручной работы в мастерской Omnia",
    },
    description:
      "Ханги и хэндпаны ручной работы из нержавеющей стали: строй, количество нот и запись реального звучания каждого инструмента. Изготовление под заказ, доставка СДЭК по России.",
    alternates: { canonical: page > 1 ? `/catalog?page=${page}` : "/catalog" },
  };
}
