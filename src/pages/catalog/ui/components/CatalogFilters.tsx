"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/shared/ui";
import { useBreakpoints } from "@/shared/lib";

const inputClass =
  "w-full min-w-0 rounded-input border border-ink-900/18 bg-white px-4 py-3 text-[15px] outline-none transition-colors focus:border-brand";

const MIN_QUERY_LENGTH = 2;
const APPLY_DELAY_MS = 1000;
const RANGE_KEYS = ["priceMin", "priceMax", "notesMin", "notesMax"] as const;

interface RangeValues {
  priceMin: string;
  priceMax: string;
  notesMin: string;
  notesMax: string;
}

const emptyRangeValues: RangeValues = { priceMin: "", priceMax: "", notesMin: "", notesMax: "" };

function readRangeFromParams(searchParams: ReadonlyURLSearchParams | null): RangeValues {
  return {
    priceMin: searchParams?.get("priceMin") ?? "",
    priceMax: searchParams?.get("priceMax") ?? "",
    notesMin: searchParams?.get("notesMin") ?? "",
    notesMax: searchParams?.get("notesMax") ?? "",
  };
}

type FilterParamPatch = Partial<
  Record<"q" | "priceMin" | "priceMax" | "notesMin" | "notesMax", string | undefined>
>;

/** Переносит патч поверх текущих searchParams, сбрасывая пагинацию — не трогает ключи, которых нет в патче. */
function mergeParams(searchParams: ReadonlyURLSearchParams | null, patch: FilterParamPatch): string {
  const params = new URLSearchParams(searchParams ?? undefined);
  for (const [key, value] of Object.entries(patch)) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  params.delete("page");
  return params.toString();
}

export function CatalogFilters() {
  const pathname = usePathname() ?? "/catalog";
  const searchParams = useSearchParams();
  const breakpoints = useBreakpoints();

  // до монтирования реальная ширина экрана неизвестна — ничего не рендерим,
  // чтобы не тащить в DOM сразу оба варианта (двойное состояние, лишние инпуты)
  if (!breakpoints) return null;

  if (breakpoints.isDesktop) {
    return <DesktopFilters pathname={pathname} searchParams={searchParams} />;
  }

  return (
    <div className="-mx-5 flex items-center gap-3 bg-paper-50/88 px-5 py-3 backdrop-blur-md md:-mx-12 md:px-12">
      <SearchField pathname={pathname} searchParams={searchParams} className="flex-1" />
      <MobileFilters pathname={pathname} searchParams={searchParams} />
    </div>
  );
}

/** Поиск с автопримением через 1с — учитывается только от 2 символов. Общий для десктопа и мобилки/планшета. */
function SearchField({
  pathname,
  searchParams,
  className = "",
}: {
  pathname: string;
  searchParams: ReadonlyURLSearchParams | null;
  className?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(searchParams?.get("q") ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const trimmed = q.trim();
      const qs = mergeParams(searchParams, { q: trimmed.length >= MIN_QUERY_LENGTH ? trimmed : undefined });
      router.push(qs ? `${pathname}?${qs}` : pathname);
    }, APPLY_DELAY_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <input
      type="search"
      value={q}
      onChange={(e) => setQ(e.target.value)}
      placeholder="Название или звукоряд"
      className={`${inputClass} ${className}`}
    />
  );
}

function RangeFields({
  values,
  onChange,
}: {
  values: RangeValues;
  onChange: (patch: Partial<RangeValues>) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="mb-2 block text-[13px] font-semibold uppercase tracking-wider text-ink-600">
          Цена, ₽
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={values.priceMin}
            onChange={(e) => onChange({ priceMin: e.target.value })}
            placeholder="От"
            className={inputClass}
          />
          <span className="text-ink-600">–</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={values.priceMax}
            onChange={(e) => onChange({ priceMax: e.target.value })}
            placeholder="До"
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-[13px] font-semibold uppercase tracking-wider text-ink-600">
          Количество нот
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={8}
            max={22}
            inputMode="numeric"
            value={values.notesMin}
            onChange={(e) => onChange({ notesMin: e.target.value })}
            placeholder="От"
            className={inputClass}
          />
          <span className="text-ink-600">–</span>
          <input
            type="number"
            min={8}
            max={22}
            inputMode="numeric"
            value={values.notesMax}
            onChange={(e) => onChange({ notesMax: e.target.value })}
            placeholder="До"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}

/** Десктоп: поиск + диапазоны, без кнопок — применяются сами через 1с после последнего изменения. */
function DesktopFilters({
  pathname,
  searchParams,
}: {
  pathname: string;
  searchParams: ReadonlyURLSearchParams | null;
}) {
  const router = useRouter();
  const [values, setValues] = useState<RangeValues>(() => readRangeFromParams(searchParams));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);

  function patch(p: Partial<RangeValues>) {
    setValues((prev) => ({ ...prev, ...p }));
  }

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const qs = mergeParams(searchParams, values);
      router.push(qs ? `${pathname}?${qs}` : pathname);
    }, APPLY_DELAY_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.priceMin, values.priceMax, values.notesMin, values.notesMax]);

  return (
    <div className="rounded-card bg-white p-6">
      <div className="mb-5">
        <label className="mb-2 block text-[13px] font-semibold uppercase tracking-wider text-ink-600">
          Поиск
        </label>
        <SearchField pathname={pathname} searchParams={searchParams} />
      </div>
      <RangeFields values={values} onChange={patch} />
    </div>
  );
}

/** Мобилка/планшет: цена и ноты спрятаны в попап, применяются только по кнопке. Поиск — снаружи, рядом с кнопкой. */
function MobileFilters({
  pathname,
  searchParams,
}: {
  pathname: string;
  searchParams: ReadonlyURLSearchParams | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<RangeValues>(() => readRangeFromParams(searchParams));

  const activeCount = RANGE_KEYS.filter((key) => searchParams?.get(key)).length;

  function patch(p: Partial<RangeValues>) {
    setValues((prev) => ({ ...prev, ...p }));
  }

  function apply() {
    const qs = mergeParams(searchParams, values);
    router.push(qs ? `${pathname}?${qs}` : pathname);
    setOpen(false);
  }

  function reset() {
    setValues(emptyRangeValues);
    const qs = mergeParams(searchParams, emptyRangeValues);
    router.push(qs ? `${pathname}?${qs}` : pathname);
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // при каждом открытии попап должен показывать актуально применённые фильтры,
        // а не черновик, оставшийся от закрытия без применения
        if (next) setValues(readRangeFromParams(searchParams));
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Фильтры"
        className="relative inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-ink-900/20 px-4 py-3 text-sm font-medium transition-colors hover:border-brand hover:text-brand-dark sm:px-5"
      >
        <FilterIcon />
        <span className="hidden sm:inline">Фильтры</span>
        {activeCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-brand text-[11px] font-semibold text-white ring-2 ring-paper-50">
            {activeCount}
          </span>
        )}
      </button>
      <DialogContent>
        <div className="flex items-center justify-between">
          <DialogTitle className="font-display text-2xl font-medium">Фильтры</DialogTitle>
          <DialogClose asChild>
            <button
              aria-label="Закрыть"
              className="grid size-10.5 cursor-pointer place-items-center rounded-full border border-ink-900/15"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </DialogClose>
        </div>
        <div className="mt-8">
          <RangeFields values={values} onChange={patch} />
        </div>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="flex-1 cursor-pointer rounded-full border border-ink-900/20 px-6 py-3 text-center text-[15px] font-medium transition-colors hover:border-brand hover:text-brand-dark"
          >
            Сбросить
          </button>
          <button
            type="button"
            onClick={apply}
            className="flex-1 cursor-pointer rounded-full bg-brand px-6 py-3 text-center text-[15px] font-medium text-white transition-colors hover:bg-brand-dark"
          >
            Применить
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}
