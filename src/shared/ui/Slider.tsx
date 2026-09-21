"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ArrowRightIcon } from "./assets/icons";
import {
  Children,
  startTransition,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type EmblaOptions = NonNullable<Parameters<typeof useEmblaCarousel>[0]>;

type Props = {
  children: ReactNode;
  /** Ширина слайда по брейкпоинтам, например "basis-[86%] md:basis-1/2 xl:basis-1/3". */
  slideClassName?: string;
  /** Подпись для скринридера: что именно листается. */
  label?: string;
  className?: string;
  options?: EmblaOptions;
  /**
   * Слайды, которые досылаются по мере прокрутки, — идут после children. Пока слайд в пути,
   * на его месте placeholder, но число слайдов полное с самого начала: точки и прокрутка
   * не прыгают, когда содержимое доезжает. Следующую пачку просим, когда в кадр попадает
   * последний загруженный слайд, — она успевает приехать, пока его рассматривают.
   */
  lazy?: {
    ids: string[];
    placeholder: ReactNode;
    load: (ids: string[]) => Promise<Record<string, ReactNode>>;
    batch?: number;
  };
};

/**
 * Полоса под стрелки: 4rem с каждой стороны от слайдов (стрелка 2.75rem плюс зазоры). Место под
 * неё берётся сначала снаружи — из бокового отступа секции и полей от max-w-[1440px]:
 * отрицательный margin растягивает слайдер ровно на столько, сколько там есть, но не больше
 * полосы. Чего снаружи не хватило — отнимается у слайдов внутренним padding. Поэтому на широком
 * экране карточки остаются во всю ширину секции, на узком чуть поджимаются, но стрелки нигде не
 * слипаются с карточками и не вылезают за экран. Полсантиметра из запаса снаружи не берём: 100vw
 * считает и полосу прокрутки, без вычета слайдер вылезал бы за край окна и добавлял странице
 * горизонтальный скролл. Классы записаны целиком: Tailwind ищет их в исходнике как текст и
 * собранную из кусков строку не увидит.
 */
const ARROW_BAND =
  "md:px-16 md:ml-[calc(-1*min(4rem,max(0px,(100vw_-_100%)/2_-_0.5rem)))] md:mr-[calc(-1*min(4rem,max(0px,(100vw_-_100%)/2_-_0.5rem)))]";

/**
 * Горизонтальный слайдер на Embla — конечный, со стрелками по бокам от слайдов и точками под
 * ними. Управление скрывается само, когда все слайды помещаются в экран: на широком брейкпоинте
 * блок выглядит обычным рядом карточек, на узком листается. Ширину слайда задаёт вызывающий.
 * Стрелки показываются с md, где под полосу есть место; на телефоне листается свайпом и точками.
 */
export function Slider({
  children,
  slideClassName = "basis-full",
  label,
  className = "",
  options,
  lazy,
}: Props) {
  const initial = Children.toArray(children);
  const [loaded, setLoaded] = useState<Record<string, ReactNode>>({});
  // Сколько слайдов уже запрошено (отрендерено или в пути) — чтобы не просить одно дважды.
  const requested = useRef(initial.length);
  // Своя граница Suspense у каждого досланного слайда: пока React разрешает клиентские
  // компоненты из ответа, подвисает только этот слайд. Без неё подвисание поднималось до
  // Suspense вокруг всего слайдера, тот прятал его за заглушкой, Embla при этом
  // уничтожалась и создавалась заново — и покупатель, долиставший до седьмого слайда,
  // оказывался на первом.
  const slides = [
    ...initial,
    ...(lazy?.ids.map((id) =>
      loaded[id] ? (
        <Suspense key={id} fallback={lazy.placeholder}>
          {loaded[id]}
        </Suspense>
      ) : (
        lazy.placeholder
      ),
    ) ?? []),
  ];
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

  useEffect(() => {
    if (!embla || !lazy) return;
    const { ids, load, batch = 6 } = lazy;
    const offset = initial.length;
    const loadNext = () => {
      const inView = embla.slidesInView();
      if (inView.length === 0 || requested.current >= offset + ids.length) return;
      if (Math.max(...inView) + 1 < requested.current) return;

      const from = requested.current - offset;
      const next = ids.slice(from, from + batch);
      requested.current += next.length;
      load(next)
        // В переходе React держит на экране старую разметку, а не показывает fallback.
        .then((got) => startTransition(() => setLoaded((prev) => ({ ...prev, ...got }))))
        .catch(() => {
          // Сеть подвела — вернём пачку в очередь, следующая прокрутка попросит её снова.
          requested.current = Math.min(requested.current, offset + from);
        });
    };
    loadNext();
    embla.on("slidesInView", loadNext);
    return () => {
      embla.off("slidesInView", loadNext);
    };
  }, [embla, lazy, initial.length]);

  const scrollTo = useCallback((index: number) => embla?.scrollTo(index), [embla]);

  const scrollable = canPrev || canNext;

  return (
    <div className={className}>
      <div className={`relative ${ARROW_BAND}`}>
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
          <>
            <SliderArrow direction="prev" disabled={!canPrev} onClick={() => embla?.scrollPrev()} />
            <SliderArrow direction="next" disabled={!canNext} onClick={() => embla?.scrollNext()} />
          </>
        )}
      </div>

      {scrollable && (
        <div className="mt-2 flex items-center justify-center gap-2.5">
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
      )}
    </div>
  );
}

/**
 * Пока листать есть куда — стрелка оранжевая, на границе списка гаснет до серой: видно, что
 * слайдер кончился, ещё до нажатия.
 */
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
      className={`absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full border transition-colors md:grid ${
        disabled
          ? "cursor-default border-ink-900/15 text-ink-900/30"
          : "cursor-pointer border-brand text-brand hover:bg-brand hover:text-white"
      } ${direction === "prev" ? "left-2" : "right-2"}`}
    >
      <ArrowRightIcon size={18} className={direction === "prev" ? "rotate-180" : undefined} />
    </button>
  );
}
