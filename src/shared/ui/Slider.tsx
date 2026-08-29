"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ArrowRightIcon } from "./assets/icons";
import { Children, useCallback, useEffect, useState, type ReactNode } from "react";

type EmblaOptions = NonNullable<Parameters<typeof useEmblaCarousel>[0]>;

type Props = {
  children: ReactNode;
  /** Ширина слайда по брейкпоинтам, например "basis-[86%] md:basis-1/2 xl:basis-1/3". */
  slideClassName?: string;
  /** Подпись для скринридера: что именно листается. */
  label?: string;
  className?: string;
  options?: EmblaOptions;
};

/**
 * Горизонтальный слайдер на Embla — конечный (без loop), с точками и стрелками.
 * Управление скрывается само, когда все слайды помещаются в экран: так один и тот же
 * блок на широком брейкпоинте выглядит обычным рядом карточек, а на узком листается.
 * Ширину слайда задаёт вызывающий через slideClassName — она у каждой витрины своя.
 */
export function Slider({
  children,
  slideClassName = "basis-full",
  label,
  className = "",
  options,
}: Props) {
  const slides = Children.toArray(children);
  const [emblaRef, embla] = useEmblaCarousel({ align: "start", ...options });
  const [snaps, setSnaps] = useState<number[]>([]);
  const [selected, setSelected] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    if (!embla) return;
    const sync = () => {
      setSnaps(embla.scrollSnapList());
      setSelected(embla.selectedScrollSnap());
      setCanPrev(embla.canScrollPrev());
      setCanNext(embla.canScrollNext());
    };
    sync();
    embla.on("select", sync).on("reInit", sync);
    return () => {
      embla.off("select", sync).off("reInit", sync);
    };
  }, [embla]);

  const scrollTo = useCallback((index: number) => embla?.scrollTo(index), [embla]);

  const scrollable = canPrev || canNext;

  return (
    <div className={className}>
      <div
        ref={emblaRef}
        className="-mt-2 overflow-hidden pb-8 pt-2"
        role={scrollable ? "region" : undefined}
        aria-roledescription={scrollable ? "карусель" : undefined}
        aria-label={scrollable ? label : undefined}
      >
        <div className="-ml-6 flex touch-pan-y">
          {slides.map((slide, i) => (
            <div key={i} className={`flex min-w-0 shrink-0 grow-0 pl-6 ${slideClassName}`}>
              <div className="w-full">{slide}</div>
            </div>
          ))}
        </div>
      </div>

      {scrollable && (
        <div className="mt-2 flex items-center justify-center gap-4">
          <SliderArrow direction="prev" disabled={!canPrev} onClick={() => embla?.scrollPrev()} />
          <div className="flex items-center gap-2.5">
            {snaps.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollTo(i)}
                aria-label={`Слайд ${i + 1}`}
                aria-current={i === selected}
                className={`size-2.5 cursor-pointer rounded-full transition-colors ${
                  i === selected ? "bg-brand" : "bg-ink-900/20 hover:bg-ink-900/40"
                }`}
              />
            ))}
          </div>
          <SliderArrow direction="next" disabled={!canNext} onClick={() => embla?.scrollNext()} />
        </div>
      )}
    </div>
  );
}

function SliderArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "prev" ? "Назад" : "Вперёд"}
      className="hidden size-11 cursor-pointer place-items-center rounded-full border border-ink-900/15 transition-colors hover:border-brand hover:text-brand-dark disabled:cursor-default disabled:opacity-30 disabled:hover:border-ink-900/15 disabled:hover:text-ink-900 md:grid"
    >
      <ArrowRightIcon size={18} className={direction === "prev" ? "rotate-180" : undefined} />
    </button>
  );
}
