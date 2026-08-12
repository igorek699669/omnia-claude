import { getCatalogProducts, ProductCard } from "@/entities/product";
import { AddToCartButton } from "@/features/cart";
import { NotifyMeButton } from "@/features/notify-me";
import { Tag, SectionTitle } from "@/shared/ui";
import { CatalogFilters } from "./components/CatalogFilters";
import { Pagination } from "./components/Pagination";

// Сколько карточек показывать за раз зависит от того, сколько колонок в сетке
// (см. grid ниже: 1 колонка < sm, 2 колонки sm–xl, 3 колонки xl+). Сервер не знает
// ширину экрана, поэтому забираем сразу под самую широкую раскладку (12 = 3×4),
// а лишние карточки на узких экранах прячем через CSS, не трогая пагинацию.
const PAGE_SIZE = 12;
const MOBILE_VISIBLE = 5;
const TABLET_VISIBLE = 8;

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

  const { docs: products, totalPages, totalDocs } = await getCatalogProducts({
    q: sp.q,
    priceMin: toNumber(sp.priceMin),
    priceMax: toNumber(sp.priceMax),
    notesMin: toNumber(sp.notesMin),
    notesMax: toNumber(sp.notesMax),
    page,
    limit: PAGE_SIZE,
  });

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-12">
      <Tag>Каталог</Tag>
      <SectionTitle className="mt-5">Все инструменты</SectionTitle>
      <p className="mt-4 max-w-[56ch] text-ink-600">
        Пока в каталоге ханги. Глюкофоны, RAV-драмы и комплектующие появятся позже.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
        <div className="sticky top-20 z-10 self-start lg:top-26">
          <CatalogFilters />
        </div>

        <div>
          {products.length === 0 ? (
            <p className="rounded-card bg-white p-12 text-center text-ink-600">
              Ничего не найдено — попробуйте изменить фильтры.
            </p>
          ) : (
            <>
              <p className="text-sm text-ink-600">Найдено инструментов: {totalDocs}</p>
              <div className="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((p, i) => (
                  <div
                    key={p.id}
                    className={
                      i < MOBILE_VISIBLE ? undefined : i < TABLET_VISIBLE ? "hidden sm:block" : "hidden xl:block"
                    }
                  >
                    <ProductCard
                      product={p}
                      cartAction={
                        p.inStock ? (
                          <AddToCartButton key={p.id} product={p} />
                        ) : (
                          <NotifyMeButton key={p.id} product={p} variant="icon" />
                        )
                      }
                    />
                  </div>
                ))}
              </div>
              <Pagination page={page} totalPages={totalPages} searchParams={sp} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
