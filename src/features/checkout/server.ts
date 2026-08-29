/**
 * Серверный публичный API слайса — только для Route Handlers и Server Components.
 *
 * Отдельный вход, а не общий index.ts: эти функции работают через Payload Local API, и импорт
 * из клиентского компонента затащил бы Payload (и node:fs) в браузерный бандл. "use server"
 * вешать нельзя — регистрация отправления стала бы открытым эндпоинтом.
 */
export { registerCdekShipment, syncCdekOrderNumber } from "./api/shipment";
export { sendPaidOrderEmail, sendCustomerOrderEmail } from "./api/order-mail";
export { finalizePaidOrder } from "./api/finalize";
export type { FinalizeResult } from "./api/finalize";
export { reconcileCustomerOrders } from "./api/reconcile";
