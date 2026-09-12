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
          ? `Каталог хангов Omnia, страница ${page}. Послушайте и выберите свой хэндпан`
          : "Каталог хангов Omnia. Послушайте и выберите свой хэндпан. Музыкальные инструменты от 79 990 ₽",
    },
    description:
      "Выберите своё звучание hang drum. От 9 до 21 нот. 14 строев от Kurd до Pygmy. В наличии и под заказ. Доставка СДЭК по России.",
    alternates: { canonical: page > 1 ? `/catalog?page=${page}` : "/catalog" },
  };
}
