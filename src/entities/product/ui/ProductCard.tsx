import Image from "next/image";
import Link from "next/link";
import type { Product } from "../model/types";
import { HANDPAN_DIAMETER_CM, HANDPAN_RIM_CM, HANDPAN_WEIGHT_GRAMS } from "../model/constants";
import { ProductGallery, CARD_IMAGE_SIZES } from "./ProductGallery";
import { formatPrice } from "@/shared/lib";
import { AudioPlayerChip, HandpanArt } from "@/shared/ui";

export function ProductCard({
  product,
  cartAction,
}: {
  product: Product;
  cartAction?: React.ReactNode;
}) {
  const media = product.media;

  return (
    <article className="flex flex-col overflow-hidden rounded-card bg-white transition-all hover:-translate-y-1 hover:shadow-[0_32px_64px_-32px_rgba(28,20,16,0.3)]">
      {/* Верхний паддинг 20px — снаружи aspect-ratio блока, а не паддингом/inset внутри него:
          иначе object-cover пришлось бы сильнее обрезать фото по высоте, чтобы всё равно
          заполнить уменьшенный бокс (см. отступ по бокам ниже — та же причина). */}
      <div className="bg-white pt-5">
        <div className="relative aspect-[4/3] overflow-hidden">
          {!product.inStock && (
            <span className="absolute left-3.5 top-3.5 z-10 rounded-full bg-ink-900/85 px-3.5 py-1.5 text-[13px] font-semibold text-white">
              Нет в наличии
            </span>
          )}
          <div className="absolute inset-x-6 inset-y-0">
            {media.length > 1 ? (
              <ProductGallery media={media} />
            ) : media[0] ? (
              <Image
                src={media[0].url}
                alt={media[0].alt}
                fill
                sizes={CARD_IMAGE_SIZES}
                className="object-cover"
              />
            ) : (
              <HandpanArt className="absolute inset-0 m-auto h-[85%] w-[85%]" />
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <div className="flex items-center justify-between gap-3">
          <AudioPlayerChip src={product.audioSample} />
        </div>

        <h3 className="font-display text-2xl font-medium leading-tight">
          <Link href={`/product/${product.slug}`} className="hover:text-brand-dark">
            {product.name}
          </Link>
        </h3>
        <p className="text-sm font-medium">
          <span className="font-normal text-ink-600">Звукоряд · </span>
          {product.scaleNotes}
        </p>

        <div className="flex items-baseline gap-3 pt-1">
          <span className="font-display text-[28px] font-semibold">{formatPrice(product.price)}</span>
          {product.oldPrice && (
            <s className="text-ink-600">{formatPrice(product.oldPrice)}</s>
          )}
        </div>
        <p className="text-[13px] text-ink-600">
          {product.notesCount} нот · {(HANDPAN_WEIGHT_GRAMS / 1000).toLocaleString("ru-RU")} кг ·
          диаметр {HANDPAN_DIAMETER_CM} см (+{HANDPAN_RIM_CM} см окантовка) · {product.tuningHz} Hz
        </p>

        <div className="mt-auto flex items-center justify-between gap-4 pt-2">
          <Link
            href={`/product/${product.slug}`}
            className="flex-1 rounded-full border border-ink-900/20 px-6 py-3 text-center text-[15px] font-medium transition-colors hover:border-brand hover:text-brand-dark"
          >
            Подробнее
          </Link>
          {cartAction}
        </div>
      </div>
    </article>
  );
}
