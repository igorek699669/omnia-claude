/**
 * Яндекс.Метрика.
 *
 * Номер счётчика не секрет — он и так виден в исходниках страницы, поэтому лежит прямо
 * здесь, как телефон и почта в contacts.ts. Переменная окружения нужна не для прода, а
 * чтобы счётчик можно было выключить: в E2E он пустой, иначе каждый прогон стучался бы
 * на mc.yandex.ru и портил статистику вперемешку с живыми визитами.
 */
const RAW_ID = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID ?? "111975075";

/** null — счётчик выключен, подключать нечего. */
export const METRIKA_ID: number | null = RAW_ID.trim() === "" ? null : Number(RAW_ID);

declare global {
  interface Window {
    ym?: (id: number, action: string, ...args: unknown[]) => void;
  }
}

/**
 * Вызов Метрики, безопасный до её загрузки и при выключенном счётчике.
 *
 * Официальный сниппет создаёт заглушку window.ym раньше самого скрипта и копит вызовы,
 * так что дожидаться загрузки не нужно. Но если согласия не было, ym нет вовсе — отсюда
 * опциональный вызов, а не проверка на «загрузилось ли».
 *
 * Пригодится для целей и электронной коммерции: ym("reachGoal", "checkout-started").
 */
export function ym(action: string, ...args: unknown[]): void {
  if (typeof window === "undefined" || METRIKA_ID === null) return;
  window.ym?.(METRIKA_ID, action, ...args);
}

export const GOALS = {
  addToCart: "add-to-cart",
  checkoutStarted: "checkout-started",
  orderPaid: "order-paid",
  messengerClick: "messenger-click",
  phoneClick: "phone-click",
  restockSubscribed: "restock-subscribed",
  audioPlay: "audio-play",
} as const;

export function reachGoal(goal: string, params?: Record<string, unknown>): void {
  ym("reachGoal", goal, params);
}
