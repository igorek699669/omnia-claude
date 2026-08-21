import { COOKIE_CONSENT_KEY } from "./storage-keys";

export type CookieConsent = "all" | "necessary";

// Пока на сайте нет аналитики (Яндекс.Метрика — Roadmap, шаг 7) реальной разницы между
// "all" и "necessary" нет: и то и другое не подключает ничего необязательного. Флаг уже
// нужен сейчас, чтобы баннер не был декоративным "ОК" — при подключении Метрики её
// инициализация должна быть завёрнута в hasAnalyticsConsent().
export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(COOKIE_CONSENT_KEY) === "all";
}
