/**
 * Серверный публичный API слайса — только для Route Handlers и Server Components.
 *
 * Отдельный вход, а не общий index.ts: здешние функции работают через Payload Local API и
 * не имеют "use server", поэтому импорт их из клиентского компонента затащил бы Payload
 * (и node:fs) в браузерный бандл. Директиву "use server" вешать нельзя — она превратила бы
 * регистрацию отправления в открытый эндпоинт, дёргаемый из браузера.
 */
export { registerCdekShipment, syncCdekOrderNumber } from "./api/shipment";
