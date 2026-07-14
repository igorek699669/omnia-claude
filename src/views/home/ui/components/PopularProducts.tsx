import Link from "next/link";
import { getProducts, ProductCard } from "@/entities/product";
import { AddToCartButton } from "@/features/cart";
import { Tag, SectionTitle } from "@/shared/ui";

export function PopularProducts() {
  const products = getProducts();

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
          <ProductCard key={p.id} product={p} cartAction={<AddToCartButton key={p.id} product={p} />} />
        ))}
      </div>
    </section>
  );
}
