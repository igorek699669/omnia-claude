import { getCatalogProducts, ProductCard, ProductCardSkeleton } from "@/entities/product";
import type { CatalogFilters as CatalogQuery } from "@/entities/product";
import { AddToCartButton } from "@/features/cart";
import { NotifyMeButton } from "@/features/notify-me";
import { Skeleton } from "@/shared/ui";
import { Pagination } from "./Pagination";

// Сколько карточек показывать за раз зависит от того, сколько колонок в сетке
// (см. grid ниже: 1 колонка < sm, 2 колонки sm–xl, 3 колонки xl+). Сервер не знает
// ширину экрана, поэтому забираем сразу под самую широкую раскладку (12 = 3×4),
// а лишние карточки на узких экранах прячем через CSS, не трогая пагинацию.
export const PAGE_SIZE = 12;
const MOBILE_VISIBLE = 5;
const TABLET_VISIBLE = 8;

/** Класс, прячущий карточку на брейкпоинтах, где она не помещается в ряды. */
function visibilityClass(index: number) {
  if (index < MOBILE_VISIBLE) return undefined;
  return index < TABLET_VISIBLE ? "hidden sm:block" : "hidden xl:block";
}

export async function CatalogGrid({
  query,
  searchParams,
}: {
  query: CatalogQuery;
  searchParams: Record<string, string | undefined>;
}) {
  const { docs: products, totalPages, totalDocs } = await getCatalogProducts(query);
  const page = query.page ?? 1;

  if (products.length === 0) {
    return (
      <p className="rounded-card bg-white p-12 text-center text-ink-600">
        Ничего не найдено — попробуйте изменить фильтры.
      </p>
    );
  }

  return (
    <>
      <p className="text-sm text-ink-600">Найдено инструментов: {totalDocs}</p>
      <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((p, i) => (
          <div key={p.id} className={visibilityClass(i)}>
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
      <Pagination page={page} totalPages={totalPages} searchParams={searchParams} />
    </>
  );
}

/** Сколько карточек-заглушек рисовать — по два ряда на каждом брейкпоинте. */
const SKELETON_COUNT = 6;

export function CatalogGridSkeleton() {
  return (
    <div role="status" aria-label="Загружаем инструменты">
      <Skeleton className="h-5 w-48" />
      <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <div
            key={i}
            className={i < 2 ? undefined : i < 4 ? "hidden sm:block" : "hidden xl:block"}
          >
            <ProductCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}
