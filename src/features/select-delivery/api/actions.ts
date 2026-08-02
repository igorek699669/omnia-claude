"use server";

import { getAllCdekCities, getCdekPvzPoints, resolveCdekCityCode, calculateCdekTariff } from "@/shared/lib";
import type { CdekCityMatch } from "@/shared/lib";
import { deriveShipmentPackages } from "./package";
import { CITY_SEARCH_MIN_CHARS } from "../model/types";
import type { DeliveryType, Pvz } from "../model/types";

function normalizeCityName(text: string): string {
  return text.trim().toLowerCase().replace(/ё/g, "е");
}

// Живой фильтр СДЭК (/location/cities?city=...) матчит только точные/полные названия —
// на неполном вводе отдаёт пустой список. Поэтому справочник городов тянем целиком
// (см. getAllCdekCities — кешируется в памяти процесса) и ищем подстроку сами: так
// подсказки работают от 2 букв, а результат сразу приходит с настоящим code.
export async function searchCitySuggestions(query: string): Promise<CdekCityMatch[]> {
  const q = normalizeCityName(query);
  if (q.length < CITY_SEARCH_MIN_CHARS) return [];

  const cities = await getAllCdekCities();
  const matches: { city: CdekCityMatch; index: number }[] = [];
  for (const city of cities) {
    const index = normalizeCityName(city.city).indexOf(q);
    if (index === -1) continue;
    matches.push({ city, index });
  }

  // Совпадения с начала названия («Бря» → «Брянск») — выше тех, где строка встретилась
  // где-то в середине; при равенстве — короче название вперёд (обычно оно и нужнее).
  matches.sort((a, b) => a.index - b.index || a.city.city.length - b.city.city.length);
  return matches.slice(0, 8).map((m) => m.city);
}

export async function getPvzPointsByCity(cityCode: number): Promise<Pvz[]> {
  const points = await getCdekPvzPoints(cityCode);
  return points.map((p) => ({
    provider: "cdek" as const,
    code: p.code,
    city: p.city,
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
