"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProductMedia } from "../model/types";

/** Ширина медиа-блока карточки по брейкпоинтам — для next/image. */
export const CARD_IMAGE_SIZES = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw";

/** Медиа-блок страницы товара — половина экрана на десктопе. */
export const PRODUCT_PAGE_IMAGE_SIZES = "(min-width: 1024px) 50vw, 100vw";

/**
 * Слайдер медиа товара. Рендерится только когда кадров больше одного —
 * на единственном фото точки и переключение не нужны (см. ProductCard/ProductPage).
 */
export function ProductGallery({
  media,
  sizes = CARD_IMAGE_SIZES,
  fit = "cover",
  priority = false,
}: {
  media: ProductMedia[];
  sizes?: string;
  fit?: "cover" | "contain";
  /** Ставится, только если галерея — LCP-элемент страницы; грузится вперёд первый кадр. */
  priority?: boolean;
}) {
  const [active, setActive] = useState(0);

  return (
    <>
      {media.map((item, i) => (
        <Image
          key={item.url}
          src={item.url}
          alt={item.alt}
          fill
          sizes={sizes}
          priority={priority && i === 0}
          className={`${fit === "cover" ? "object-cover" : "object-contain"} transition-opacity duration-400 ${
            i === active ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        />
      ))}

      <div className="absolute bottom-3.5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {media.map((item, i) => (
          <button
            key={item.url}
            type="button"
            aria-label={`Слайд ${i + 1}`}
            aria-current={i === active}
            onClick={() => setActive(i)}
            className={`size-2 cursor-pointer rounded-full transition-all ${
              i === active ? "scale-130 bg-brand" : "bg-white/55"
            }`}
          />
        ))}
      </div>
    </>
  );
}
