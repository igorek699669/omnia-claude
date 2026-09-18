"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { COOKIE_NOTICE_KEY } from "./storage-keys";

interface CookieNoticeState {
  /** false — человек ещё не закрывал уведомление, надо его показать. */
  acknowledged: boolean;
  /** false, пока ответ не поднят из localStorage: до этого показывать нечего. */
  hydrated: boolean;
  acknowledge: () => void;
}

/**
 * Уведомление о cookie. Через Zustand, как и корзина: он уже умеет и подписку, и сохранение,
 * и согласованность между вкладками. hydrated нужен из-за персиста: на сервере и на первом
 * клиентском рендере состояние пустое, и без флага плашка моргала бы у тех, кто её закрыл.
 *
 * Раньше здесь жил выбор «все / только необходимые», от которого зависела загрузка Метрики.
 * Теперь аналитика отнесена к необходимым и грузится всегда, так что выбирать нечего —
 * осталась отметка «прочитал». Ключ персиста тоже сменился (был omnia-cookie-consent):
 * старый выбор больше ничего не значит, а плашку с новым текстом надо показать заново.
 */
export const useCookieNotice = create<CookieNoticeState>()(
  persist(
    (set) => ({
      acknowledged: false,
      hydrated: false,
      acknowledge: () => set({ acknowledged: true }),
    }),
    {
      name: COOKIE_NOTICE_KEY,
      // Сохраняем только сам ответ: hydrated — про текущую загрузку страницы, не про данные.
      partialize: (state) => ({ acknowledged: state.acknowledged }),
      onRehydrateStorage: () => (state) => state && (state.hydrated = true),
    },
  ),
);
