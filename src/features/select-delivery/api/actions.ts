"use server";

import { resolveCdekCityCode, getCdekPvzPoints, calculateCdekTariff } from "@/shared/lib";
import { deriveShipmentPackages } from "./package";
import type { DeliveryType, Pvz } from "../model/types";

export async function getPvzPoints(city: string): Promise<Pvz[]> {
  const cityCode = await resolveCdekCityCode(city);
  const points = await getCdekPvzPoints(cityCode);
  return points.map((p) => ({
    provider: "cdek" as const,
    code: p.code,
    address: p.address,
    lat: p.lat,
    lon: p.lon,
    workTime: p.workTime,
  }));
}

export interface CalculateDeliveryCostInput {
  items: { productId: string; qty: number }[];
  type: DeliveryType;
  city: string;
}

export async function calculateDeliveryCost(input: CalculateDeliveryCostInput): Promise<number> {
  const packages = deriveShipmentPackages(input.items);
  const cityCode = await resolveCdekCityCode(input.city);
  return calculateCdekTariff({
    cityCode,
    type: input.type,
    packages,
  });
}
