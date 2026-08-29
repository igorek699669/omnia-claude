/**
 * Номер счётчика не секрет — он и так виден в исходниках страницы. Переменная окружения
 * нужна не для прода, а чтобы счётчик можно было выключить: в E2E она пустая, иначе каждый
 * прогон стучался бы на mc.yandex.ru и мешался с живыми визитами.
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
 * Вызов Метрики, безопасный до её загрузки и при выключенном счётчике: сниппет создаёт
 * заглушку window.ym раньше самого скрипта и копит вызовы, а без согласия ym нет вовсе —
 * отсюда опциональный вызов, а не проверка «загрузилось ли».
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
