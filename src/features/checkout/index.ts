// Публичный API слайса для клиента. Серверная часть (регистрация отправления) намеренно
// вынесена в ./server: она тянет Payload, а этот файл импортируют клиентские компоненты
// (CheckoutSuccessPage) — попав сюда, Payload утащил бы в браузерный бандл node:fs.
export { createOrderPayment, getOrderStatus } from "./api/actions";
export type { CheckoutInput, CheckoutResult } from "./model/types";
