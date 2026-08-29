import { Suspense } from "react";
import { Tag, SectionTitle, Breadcrumbs } from "@/shared/ui";
import { CatalogFilters } from "./components/CatalogFilters";
import { CatalogGrid, CatalogGridSkeleton, PAGE_SIZE } from "./components/CatalogGrid";

type SearchParams = {
  q?: string;
  priceMin?: string;
  priceMax?: string;
  notesMin?: string;
  notesMax?: string;
  page?: string;
};

function toNumber(value: string | undefined) {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-12">
      <Breadcrumbs className="mb-6" items={[{ name: "Главная", href: "/" }, { name: "Каталог" }]} />
      <Tag>Каталог</Tag>
      <SectionTitle as="h1" className="mt-5">Все инструменты</SectionTitle>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <div className="sticky top-20 z-30 min-w-0 self-start lg:top-26">
          <CatalogFilters />
        </div>

        <div>
          {/* Запрос к Payload вынесен под Suspense, а не в loading.tsx всего сегмента:
              фильтры и поле поиска остаются смонтированными, пока грузится выдача, —
              иначе при автоприменении фильтра инпут терял бы фокус на каждой букве.
              key заставляет границу пересуспендиться при смене фильтров. */}
          <Suspense key={JSON.stringify(sp)} fallback={<CatalogGridSkeleton />}>
            <CatalogGrid
              query={{
                q: sp.q,
                priceMin: toNumber(sp.priceMin),
                priceMax: toNumber(sp.priceMax),
                notesMin: toNumber(sp.notesMin),
                notesMax: toNumber(sp.notesMax),
                page,
                limit: PAGE_SIZE,
              }}
              searchParams={sp}
            />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
