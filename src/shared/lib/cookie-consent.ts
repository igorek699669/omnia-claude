import { COOKIE_CONSENT_KEY } from "./storage-keys";

export type CookieConsent = "all" | "necessary";

/**
 * Событие о том, что человек только что выбрал вариант в баннере.
 *
 * Нужно, потому что localStorage о своих изменениях в той же вкладке не сообщает (событие
 * storage прилетает только соседним). Без него Метрика подключилась бы лишь на следующей
 * загрузке страницы, и первый визит — тот самый, где видно, откуда человек пришёл, —
 * терялся бы целиком.
 */
export const COOKIE_CONSENT_EVENT = "omnia:cookie-consent";

export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(COOKIE_CONSENT_KEY) === "all";
}

/** Записать выбор и сразу сообщить о нём тем, кто его ждёт. */
export function setCookieConsent(consent: CookieConsent): void {
  window.localStorage.setItem(COOKIE_CONSENT_KEY, consent);
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT));
}
