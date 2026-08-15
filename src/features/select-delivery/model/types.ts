import type { DeliveryProvider, DeliveryType } from "@/shared/lib";

export type { DeliveryProvider, DeliveryType };

// Порог для живых подсказок города (клиент и сервер должны совпадать — см. DeliveryPicker.tsx и actions.ts).
export const CITY_SEARCH_MIN_CHARS = 2;

export interface Pvz {
  provider: DeliveryProvider;
  code: string;
  city: string;
  address: string;
  lat: number;
  lon: number;
  workTime?: string;
}

export interface Delivery {
  provider: DeliveryProvider;
  type: DeliveryType;
  label: string;
  address: string;
  cost: number;
  pvzCode?: string;
  /**
   * Город и тариф нужны уже после оплаты — для регистрации отправления (см.
   * features/checkout/api/shipment). Город в виде кода, а не строки: у названий есть
   * тёзки (тот самый хутор «Брянск» в Дагестане), а тариф — ровно тот, по которому
   * покупателю посчитали cost, иначе СДЭК выставит другую сумму.
   */
  city: string;
  cityCode: number;
  tariffCode: number;
}
