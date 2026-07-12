"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "../model/types";
import { formatPrice } from "@/shared/lib/format";
import { HandpanArt } from "@/shared/assets";

/** Слайды медиа: видео идёт первым (пока заглушки — см. CLAUDE.md) */
const slides = ["video", "photo", "photo-close"] as const;

export function ProductCard({
  product,
  cartAction,
}: {
  product: Product;
  cartAction?: React.ReactNode;
}) {
  const [active, setActive] = useState(0);

  return (
    <article className="flex flex-col overflow-hidden rounded-card bg-white transition-all hover:-translate-y-1 hover:shadow-[0_32px_64px_-32px_rgba(28,20,16,0.3)]">
      {/* Медиа-слайдер: первый слайд — видео */}
      <div className="relative aspect-[4/3] bg-paper-200">
        {slides.map((slide, i) => (
          <div
            key={slide}
            className={`absolute inset-0 transition-opacity duration-400 ${i === active ? "opacity-100" : "opacity-0"}`}
          >
            {slide === "video" ? (
              <div className="relative h-full w-full bg-[#241a12]">
                <HandpanArt className="absolute inset-0 m-auto h-3/4 w-3/4" />
                <button
                  aria-label="Смотреть видео"
                  className="absolute inset-0 m-auto grid size-14 cursor-pointer place-items-center rounded-full bg-white/85 text-brand transition-transform hover:scale-108 hover:bg-white"
                >
                  <PlayIcon size={20} />
                </button>
              </div>
            ) : (
              <HandpanArt
                className={`absolute inset-0 m-auto ${slide === "photo-close" ? "h-[130%] w-[130%]" : "h-[85%] w-[85%]"}`}
              />
            )}
          </div>
        ))}
        <div className="absolute bottom-3.5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {slides.map((slide, i) => (
            <button
              key={slide}
              aria-label={`Слайд ${i + 1}`}
              onClick={() => setActive(i)}
              className={`size-2 cursor-pointer rounded-full transition-all ${i === active ? "scale-130 bg-brand" : "bg-white/55"}`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <div className="flex items-center justify-between gap-3">
          <button className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-paper-100 px-4 py-2 text-sm font-medium transition-colors hover:bg-brand hover:text-white">
            <PlayIcon size={12} /> Поиграть на ханге
          </button>
          <div className="flex gap-2">
            <SocialLink label="Спросить в Telegram" href="#" icon="tg" />
            <SocialLink label="Спросить в WhatsApp" href="#" icon="wa" />
          </div>
        </div>

        <h3 className="font-display text-2xl font-medium leading-tight">
          <Link href={`/product/${product.slug}`} className="hover:text-brand-dark">
            {product.name}
          </Link>
        </h3>
        <p className="text-sm text-ink-600">{product.soundCharacter}</p>
        <p className="text-sm font-medium">
          <span className="font-normal text-ink-600">Строй · </span>
          {product.scale} — {product.scaleNotes.split(" ").slice(0, 3).join(" ")}
        </p>

        <div className="flex items-baseline gap-3 pt-1">
          <span className="font-display text-[28px] font-semibold">{formatPrice(product.price)}</span>
          {product.oldPrice && (
            <s className="text-ink-600">{formatPrice(product.oldPrice)}</s>
          )}
        </div>
        <p className="text-[13px] text-ink-600">
          {product.notesCount} нот · {(product.weightGrams / 1000).toLocaleString("ru-RU")} кг ·
          диаметр {product.diameterCm} см · {product.material.toLowerCase()}
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

function PlayIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function SocialLink({ label, href, icon }: { label: string; href: string; icon: "tg" | "wa" }) {
  return (
    <a
      href={href}
      aria-label={label}
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
