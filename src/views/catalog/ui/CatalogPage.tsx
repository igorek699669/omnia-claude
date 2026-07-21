import { getProducts, ProductCard } from "@/entities/product";
import { AddToCartButton } from "@/features/cart";
import { Tag, SectionTitle } from "@/shared/ui";

export async function CatalogPage() {
  const products = await getProducts();

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-12">
      <Tag>Каталог</Tag>
      <SectionTitle className="mt-5">Все инструменты</SectionTitle>
      <p className="mt-4 max-w-[56ch] text-ink-600">
        Пока в каталоге ханги. Глюкофоны, RAV-драмы и комплектующие появятся позже.
      </p>
      {/* TODO: фильтры (строй, нота динга, цена) через searchParams — см. CLAUDE.md */}
      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} cartAction={<AddToCartButton key={p.id} product={p} />} />
        ))}
      </div>
    </section>
  );
}
