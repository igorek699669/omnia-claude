import { notFound } from "next/navigation";
import { getProductBySlug } from "@/entities/product";
import { formatPrice } from "@/shared/lib/format";
import { Tag } from "@/shared/ui";
import { HandpanArt } from "@/shared/assets";
import { AddToCartSection } from "./components/AddToCartSection";

export function ProductPage({ slug }: { slug: string }) {
  const product = getProductBySlug(slug);
  if (!product) notFound();

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-12">
      <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="relative">
          {/* TODO: галерея (видео первым) + реальные фото из Figma-экспорта */}
          <div className="overflow-hidden rounded-card bg-paper-200 p-10">
            <HandpanArt className="mx-auto w-full max-w-[480px]" />
          </div>
        </div>

        <div>
          <Tag>{product.inStock ? "В наличии" : "Под заказ"}</Tag>
          <h1 className="mt-5 font-display text-[clamp(36px,4vw,56px)] font-medium leading-[1.05] tracking-tight">
            {product.name}
          </h1>
          <p className="mt-3 text-lg text-ink-600">{product.soundCharacter}</p>

          <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-4 border-y border-ink-900/10 py-6 text-[15px]">
            <Spec label="Строй">{product.scale}</Spec>
            <Spec label="Звукоряд">{product.scaleNotes}</Spec>
            <Spec label="Количество нот">{product.notesCount}</Spec>
            <Spec label="Диаметр">{product.diameterCm} см</Spec>
            <Spec label="Вес">{(product.weightGrams / 1000).toLocaleString("ru-RU")} кг</Spec>
            <Spec label="Материал">{product.material}</Spec>
          </dl>

          <div className="mt-8 flex items-baseline gap-4">
            <span className="font-display text-[40px] font-semibold">{formatPrice(product.price)}</span>
            {product.oldPrice && <s className="text-xl text-ink-600">{formatPrice(product.oldPrice)}</s>}
          </div>

          <AddToCartSection product={product} />

          <p className="mt-6 text-sm text-ink-600">
            Жёсткий кофр в комплекте. Доставка СДЭК по всей России — трек-номер появится
            в личном кабинете после отправки.
          </p>
        </div>
      </div>
    </section>
  );
}

function Spec({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[13px] uppercase tracking-wider text-ink-600">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}
