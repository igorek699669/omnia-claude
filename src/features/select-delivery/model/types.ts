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
   * Нужны после оплаты, при регистрации отправления. Город кодом, а не строкой: у названий
   * есть тёзки (хутор «Брянск» в Дагестане). Тариф — ровно тот, по которому посчитали cost.
   */
  city: string;
  cityCode: number;
  tariffCode: number;
}
