export const DELIVERY_PROVIDERS = ["cdek"] as const;
export type DeliveryProvider = (typeof DELIVERY_PROVIDERS)[number];

export const DELIVERY_PROVIDER_LABELS: Record<DeliveryProvider, string> = {
  cdek: "СДЭК",
};

export const DELIVERY_TYPES = ["pvz", "courier"] as const;
export type DeliveryType = (typeof DELIVERY_TYPES)[number];
