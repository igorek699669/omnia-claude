"use client";

import { useEffect, useEffectEvent, useRef } from "react";

/**
 * Запускает effect через delay после последнего изменения deps — каждое следующее изменение
 * отменяет предыдущий таймер. На первом рендере не срабатывает: реагирует на ввод пользователя,
 * а не на значение, которое и так уже применено. Сам effect в зависимости не входит и на момент
 * срабатывания таймера читает свежее состояние, а не то, что было в момент ввода.
 */
export function useDebouncedEffect(effect: () => void, deps: unknown[], delay: number) {
  const run = useEffectEvent(effect);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    const timer = setTimeout(run, delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}
