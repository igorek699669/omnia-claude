import Image from "next/image";
import Link from "next/link";
import type { Product } from "../model/types";
import { HANDPAN_DIAMETER_CM, HANDPAN_RIM_CM, HANDPAN_WEIGHT_GRAMS } from "../model/constants";
import { ProductGallery, CARD_IMAGE_SIZES } from "./ProductGallery";
import { formatPrice, CONTACT_TELEGRAM_URL, CONTACT_WHATSAPP_URL } from "@/shared/lib";
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
      <div className={`bg-white pt-5 ${product.inStock ? "" : "grayscale"}`}>
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
          <div className="flex gap-2">
            <SocialLink label="Спросить в Telegram" href={CONTACT_TELEGRAM_URL} icon="tg" />
            <SocialLink label="Спросить в WhatsApp" href={CONTACT_WHATSAPP_URL} icon="wa" />
          </div>
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

function SocialLink({ label, href, icon }: { label: string; href: string; icon: "tg" | "wa" }) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="grid size-8.5 place-items-center rounded-full border border-ink-900/15 text-ink-600 transition-colors hover:border-brand hover:text-brand-dark"
    >
      {icon === "tg" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.6 19 18.9c-.2 1-.8 1.2-1.6.8l-4.4-3.3-2.2 2.1c-.2.2-.4.4-.9.4l.3-4.6 8.5-7.7c.4-.3-.1-.5-.6-.2L7.7 13l-4.4-1.4c-1-.3-1-1 .2-1.4l17-6.6c.8-.3 1.5.2 1.4 1z" /></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm5.3 14.3c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.4-.7-2.9-1.1-4.7-4-4.9-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.5.8 1.9.8 2 .1.1.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l.9-1c.2-.3.4-.2.7-.1l1.8.9c.3.1.5.2.5.3.1.1.1.7-.1 1.1z" /></svg>
      )}
    </a>
  );
}
