"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { COOKIE_CONSENT_KEY } from "./storage-keys";

export type CookieConsent = "all" | "necessary";

interface CookieConsentState {
  /** null — человек ещё не отвечал, надо показать баннер. */
  consent: CookieConsent | null;
  /** false, пока выбор не поднят из localStorage: до этого решать нечего. */
  hydrated: boolean;
  choose: (consent: CookieConsent) => void;
}

/**
 * Выбор по cookie. Через Zustand, как и корзина: он уже умеет и подписку, и сохранение, и
 * согласованность между вкладками. hydrated нужен из-за персиста: на сервере и на первом
 * клиентском рендере состояние пустое, и без флага баннер моргал бы у тех, кто уже ответил.
 */
export const useCookieConsent = create<CookieConsentState>()(
  persist(
    (set) => ({
      consent: null,
      hydrated: false,
      choose: (consent) => set({ consent }),
    }),
    {
      name: COOKIE_CONSENT_KEY,
      // Сохраняем только сам выбор: hydrated — про текущую загрузку страницы, не про данные.
      partialize: (state) => ({ consent: state.consent }),
      onRehydrateStorage: () => (state) => state && (state.hydrated = true),
    },
  ),
);

/** Разрешена ли аналитика. Отдельная функция — читателей двое, а условие одно. */
export function hasAnalyticsConsent(state: CookieConsentState): boolean {
  return state.consent === "all";
}
