import Link from "next/link";
import { getProducts, ProductCard } from "@/entities/product";
import { AddToCartButton } from "@/features/cart";
import { NotifyMeButton } from "@/features/notify-me";
import { Tag, SectionTitle, ArrowLink } from "@/shared/ui";

const VISIBLE_COUNT = 3;

export async function PopularProducts() {
  const allProducts = await getProducts();
  // Товары без остатка — в конец списка, чтобы на витрине сначала показывались доступные.
  const sorted = [...allProducts].sort((a, b) => Number(!a.inStock) - Number(!b.inStock));
  const products = sorted.slice(0, VISIBLE_COUNT);
  const hasMore = allProducts.length > VISIBLE_COUNT;

  return (
    <section id="catalog" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 py-24 md:px-12">
      <div className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <Tag>В наличии</Tag>
          <SectionTitle className="mt-5">Популярные инструменты</SectionTitle>
        </div>
        <Link
          href="/catalog"
          className="border-b border-ink-900/25 py-2 text-base font-medium transition-colors hover:border-brand hover:text-brand-dark"
        >
          Весь каталог
        </Link>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            cartAction={
              p.inStock ? (
                <AddToCartButton key={p.id} product={p} />
              ) : (
                <NotifyMeButton key={p.id} product={p} variant="icon" />
              )
            }
          />
        ))}
      </div>
      {hasMore && (
        <div className="mt-12 flex justify-center">
          <ArrowLink href="/catalog">Показать все инструменты</ArrowLink>
        </div>
      )}
    </section>
  );
}
