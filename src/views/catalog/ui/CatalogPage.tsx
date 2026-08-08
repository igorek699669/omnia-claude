import { getProducts, ProductCard } from "@/entities/product";
import { AddToCartButton } from "@/features/cart";
import { NotifyMeButton } from "@/features/notify-me";
import { Tag, SectionTitle } from "@/shared/ui";
import { TuningFilter } from "./components/TuningFilter";

export async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ tuningHz?: string }>;
}) {
  const { tuningHz } = await searchParams;
  const products = await getProducts(
    tuningHz === "440" || tuningHz === "432" ? { tuningHz } : undefined,
  );

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-12">
      <Tag>Каталог</Tag>
      <SectionTitle className="mt-5">Все инструменты</SectionTitle>
      <p className="mt-4 max-w-[56ch] text-ink-600">
        Пока в каталоге ханги. Глюкофоны, RAV-драмы и комплектующие появятся позже.
      </p>
      {/* TODO: фильтры по строю и цене через searchParams — см. CLAUDE.md */}
      <div className="mt-8">
        <TuningFilter />
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
    </section>
  );
}
