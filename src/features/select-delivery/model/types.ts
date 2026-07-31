import type { DeliveryProvider, DeliveryType } from "@/shared/lib";

export type { DeliveryProvider, DeliveryType };

export interface Pvz {
  provider: DeliveryProvider;
  code: string;
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
}
