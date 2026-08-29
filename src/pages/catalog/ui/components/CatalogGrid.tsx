import { getCatalogProducts, ProductCard, ProductCardSkeleton } from "@/entities/product";
import type { CatalogFilters as CatalogQuery } from "@/entities/product";
import { AddToCartButton } from "@/features/cart";
import { NotifyMeButton } from "@/features/notify-me";
import { Skeleton } from "@/shared/ui";
import { Pagination } from "./Pagination";

// Кратно трём колонкам на xl. Страницы со второй имеют собственный canonical (см. роут) —
// без этого их товары остались бы без учитываемой ссылки.
export const PAGE_SIZE = 15;

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
        {products.map((p) => (
          <div key={p.id}>
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
