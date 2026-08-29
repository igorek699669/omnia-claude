"use client";

import { useEffect, useState } from "react";

/** Значения по умолчанию Tailwind v4 (@theme в globals.css их не переопределяет). */
const QUERIES = {
  sm: "(min-width: 40rem)",
  md: "(min-width: 48rem)",
  lg: "(min-width: 64rem)",
  xl: "(min-width: 80rem)",
  "2xl": "(min-width: 96rem)",
} as const;

export interface Breakpoints {
  /** < sm (640px) */
  isMobile: boolean;
  /** sm – lg (640–1024px) */
  isTablet: boolean;
  /** >= lg (1024px) */
  isDesktop: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2xl: boolean;
}

function readBreakpoints(): Breakpoints {
  const isSm = window.matchMedia(QUERIES.sm).matches;
  const isMd = window.matchMedia(QUERIES.md).matches;
  const isLg = window.matchMedia(QUERIES.lg).matches;
  const isXl = window.matchMedia(QUERIES.xl).matches;
  const is2xl = window.matchMedia(QUERIES["2xl"]).matches;
  return {
    isSm,
    isMd,
    isLg,
    isXl,
    is2xl,
    isMobile: !isSm,
    isTablet: isSm && !isLg,
    isDesktop: isLg,
  };
}

/**
 * Брейкпоинты Tailwind плюс семантические isMobile/isTablet/isDesktop. До монтирования
 * ширина неизвестна — возвращает null, чтобы вызывающий сам решил, что рендерить до
 * гидратации, а не показывал сразу оба варианта разметки.
 */
export function useBreakpoints(): Breakpoints | null {
  const [breakpoints, setBreakpoints] = useState<Breakpoints | null>(null);

  useEffect(() => {
    const update = () => setBreakpoints(readBreakpoints());
    update();
    const mqls = Object.values(QUERIES).map((q) => window.matchMedia(q));
    mqls.forEach((mql) => mql.addEventListener("change", update));
    return () => mqls.forEach((mql) => mql.removeEventListener("change", update));
  }, []);

  return breakpoints;
}
