import { getProducts, parseProductName, ProductCard, type Product } from "@/entities/product";
import { AddToCartButton } from "@/features/cart";
import { NotifyMeButton } from "@/features/notify-me";
import { SectionTitle, Slider } from "@/shared/ui";

/** Ограничение только для «похожих по цене»: там это соседи по чеку, а не по звуку. */
const LIMIT = 5;

/** Как на главной: три карточки в ряд на xl, на узких экранах ряд листается. */
const SLIDE_WIDTH = "basis-[86%] md:basis-1/2 xl:basis-1/3";

export async function RelatedProducts({ product }: { product: Product }) {
  let all: Product[];
  try {
    all = await getProducts();
  } catch {
    return null;
  }

  const others = all.filter((p) => p.id !== product.id);
  const scaleRu = parseProductName(product.name).scaleRu;

  const sameScale = scaleRu
    ? others
      .filter((p) => parseProductName(p.name).scaleRu === scaleRu)
      .sort((a, b) => notesDistance(a, product) - notesDistance(b, product))
    : [];

  const sameScaleIds = new Set(sameScale.map((p) => p.id));
  const byPrice = others
    .filter((p) => !sameScaleIds.has(p.id))
    .sort((a, b) => Math.abs(a.price - product.price) - Math.abs(b.price - product.price))
    .slice(0, LIMIT);

  if (sameScale.length === 0 && byPrice.length === 0) return null;

  return (
    <div className="mt-20 flex flex-col gap-16">
      {sameScale.length > 0 && (
        <RelatedRow title={`Ханги в том же строе — ${scaleRu}`} products={sameScale} />
      )}
      {byPrice.length > 0 && <RelatedRow title="Похожие по цене" products={byPrice} />}
    </div>
  );
}

function notesDistance(candidate: Product, product: Product) {
  return Math.abs(candidate.notesCount - product.notesCount);
}

function RelatedRow({ title, products }: { title: string; products: Product[] }) {
  return (
    <section>
      <SectionTitle className="mb-8 text-[32px]">{title}</SectionTitle>
      <Slider label={title} slideClassName={SLIDE_WIDTH}>
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
      </Slider>
    </section>
  );
}
