"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** Как часто перезапрашивать страницу, пока оплата какого-то заказа ещё не закрыта. */
const POLL_INTERVAL_MS = 10_000;

/** Возврат фокуса срабатывает по нескольку раз подряд — не пускаем каждый чих в рендер. */
const MIN_GAP_MS = 3_000;

/**
 * Держит список заказов в профиле актуальным. Заказы приходят из Server Component, своего
 * клиентского состояния у списка нет — достаточно перезапросить серверный рендер через
 * router.refresh(); useQuery тут не нужен (см. CLAUDE.md про React Query). refresh()
 * «мягкий»: не показывает loading.tsx и не сбрасывает позицию прокрутки.
 */
export function OrdersLiveRefresh({ awaitingPayment }: { awaitingPayment: boolean }) {
  const router = useRouter();
  const lastRefreshRef = useRef(0);

  useEffect(() => {
    const refresh = () => {
      // Фоновая вкладка сервер не опрашивает — вернётся, сработает visibilitychange ниже.
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastRefreshRef.current < MIN_GAP_MS) return;
      lastRefreshRef.current = Date.now();
      router.refresh();
    };

    // Возврат на вкладку — самый частый способ увидеть заказ уже оплаченным. Заодно это
    // единственное, что обновляет трек-номер: он появляется через часы, и опрашивать
    // сервер ради него бессмысленно.
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);

    // Вебхук может прийти ровно тогда, когда человек смотрит на страницу и ничего не
    // трогает, — события фокуса тут не помогут.
    const timer = awaitingPayment ? window.setInterval(refresh, POLL_INTERVAL_MS) : undefined;

    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [awaitingPayment, router]);

  return null;
}
