import { Suspense } from "react";
import Link from "next/link";
import { getProducts, ProductCard, ProductCardSkeleton } from "@/entities/product";
import { AddToCartButton } from "@/features/cart";
import { NotifyMeButton } from "@/features/notify-me";
import { Tag, SectionTitle, ArrowLink, Slider } from "@/shared/ui";

const VISIBLE_COUNT = 3;
const SLIDE_WIDTH = "basis-[86%] md:basis-1/2 xl:basis-1/3";

/**
 * Заголовок секции — статика, поэтому рендерится сразу, а витрина из Payload
 * подгружается под Suspense: остальная главная не ждёт ответа базы.
 */
export function PopularProducts() {
  return (
    <section id="catalog" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 py-24 md:px-12">
      <div className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <Tag>В наличии и под заказ</Tag>
          <SectionTitle className="mt-5">Популярные инструменты</SectionTitle>
        </div>
        <Link
          href="/catalog"
          className="border-b border-ink-900/25 py-2 text-base font-medium transition-colors hover:border-brand hover:text-brand-dark"
        >
          Весь каталог
        </Link>
      </div>
      <Suspense fallback={<PopularGridSkeleton />}>
        <PopularGrid />
      </Suspense>
    </section>
  );
}

async function PopularGrid() {
  let allProducts;
  try {
    allProducts = await getProducts();
  } catch {
    return (
      <div className="rounded-card bg-white p-12 text-center">
        <p className="text-ink-600">Не получилось загрузить витрину — попробуйте открыть каталог.</p>
        <div className="mt-6 flex justify-center">
          <ArrowLink href="/catalog">Перейти в каталог</ArrowLink>
        </div>
      </div>
    );
  }

  const sorted = [...allProducts].sort((a, b) => Number(!a.inStock) - Number(!b.inStock));
  const products = sorted.slice(0, VISIBLE_COUNT);
  const hasMore = allProducts.length > VISIBLE_COUNT;

  if (products.length === 0) {
    return (
      <p className="rounded-card bg-white p-12 text-center text-ink-600">
        Витрина обновляется — инструменты появятся здесь совсем скоро.
      </p>
    );
  }

  return (
    <>
      <Slider label="Популярные инструменты" slideClassName={SLIDE_WIDTH}>
        {products.map((p, i) => (
          <ProductCard
            key={p.id}
            product={p}
            priority={i === 0}
            cartAction={
              p.inStock ? (
                <AddToCartButton key={p.id} product={p} />
              ) : (
                <NotifyMeButton key={p.id} product={p} variant="icon" />
              )
            }
          />
        ))}
      </Slider>
      {hasMore && (
        <div className="mt-12 flex justify-center">
          <ArrowLink href="/catalog">Показать все инструменты</ArrowLink>
        </div>
      )}
    </>
  );
}

function PopularGridSkeleton() {
  return (
    <div
      role="status"
      aria-label="Загружаем инструменты"
      className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: VISIBLE_COUNT }, (_, i) => (
        <div key={i} className={i === 0 ? undefined : i === 1 ? "hidden md:block" : "hidden xl:block"}>
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  );
}
