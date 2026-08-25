"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** Как часто перезапрашивать страницу, пока оплата какого-то заказа ещё не закрыта. */
const POLL_INTERVAL_MS = 10_000;

/**
 * Минимальный промежуток между двумя обновлениями. Возврат фокуса на вкладку легко
 * срабатывает несколько раз подряд (клик по окну, переключение из другого приложения),
 * и без этого каждый такой чих уходил бы в серверный рендер с запросом в базу.
 */
const MIN_GAP_MS = 3_000;

/**
 * Держит список заказов в профиле актуальным.
 *
 * Заказы приходят из Server Component, своего клиентского состояния у списка нет — значит
 * достаточно перезапросить серверный рендер этой же страницы через router.refresh().
 * Отдельный useQuery тут не нужен и заведён быть не должен (см. CLAUDE.md про React Query):
 * данные read-only и уже тянутся на сервере.
 *
 * refresh() — «мягкий»: он не показывает loading.tsx и не сбрасывает позицию прокрутки,
 * так что обновление статуса под курсором выглядит как подмена одной строки, а не как
 * перезагрузка страницы.
 */
export function OrdersLiveRefresh({ awaitingPayment }: { awaitingPayment: boolean }) {
  const router = useRouter();
  const lastRefreshRef = useRef(0);

  useEffect(() => {
    const refresh = () => {
      // Фоновая вкладка не должна опрашивать сервер: человек её всё равно не видит,
      // а вернётся — сработает visibilitychange ниже.
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastRefreshRef.current < MIN_GAP_MS) return;
      lastRefreshRef.current = Date.now();
      router.refresh();
    };

    // Возврат на вкладку — самый частый способ увидеть заказ уже оплаченным: человек
    // уходил платить в ЮKassa или ждал, пока СДЭК присвоит накладную. Заодно это
    // единственное, что обновляет трек-номер: он появляется через часы, опрашивать
    // ради него сервер бессмысленно.
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);

    // Пока оплата не закрыта, вебхук ЮKassa может прийти в любую секунду — причём ровно
    // в тот момент, когда человек смотрит на страницу и ничего не трогает. Тут события
    // фокуса не помогут, нужен опрос.
    const timer = awaitingPayment ? window.setInterval(refresh, POLL_INTERVAL_MS) : undefined;

    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [awaitingPayment, router]);

  return null;
}
