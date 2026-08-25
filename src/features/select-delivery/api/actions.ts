"use server";

import { suggestCdekCities, getCdekPvzPoints, calculateCdekTariff, deriveShipmentPackages } from "@/shared/lib";
import type { CdekCityMatch, CdekTariff } from "@/shared/lib";
import { CITY_SEARCH_MIN_CHARS } from "../model/types";
import { TOP_RU_CITIES } from "../model/topCities";
import type { DeliveryType, Pvz } from "../model/types";

function normalizeCityName(text: string): string {
  return text.trim().toLowerCase().replace(/ё/g, "е");
}

// Живой фильтр СДЭК (/location/cities?city=...) матчит только полные названия, поэтому
// подсказки берём с /location/suggest/cities (см. suggestCdekCities) — он понимает
// неполный ввод и сразу отдаёт настоящий code, резолвить город по строке не нужно.
export async function searchCitySuggestions(query: string): Promise<CdekCityMatch[]> {
  const q = normalizeCityName(query);
  if (q.length < CITY_SEARCH_MIN_CHARS) return [];

  const cities = await suggestCdekCities(q);

  // Города из топ-50 по населению — всегда выше остальных совпадений: СДЭК ранжирует
  // выдачу по-своему, и рядом с «Брянском» легко всплывает посёлок «Брянка», который
  // покупателю почти наверняка не нужен.
  const ranked = cities.map((city) => ({
    city,
    isTop: TOP_RU_CITIES.has(normalizeCityName(city.city)),
  }));
  ranked.sort((a, b) => Number(b.isTop) - Number(a.isTop));
  return ranked.slice(0, 8).map((m) => m.city);
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
  cityCode: number;
}

/**
 * Возвращает не только сумму, но и код тарифа: по нему после оплаты регистрируется
 * отправление, и он обязан совпадать с тем, по которому покупателю показали цену.
 *
 * Город принимаем кодом, а не названием: он уже известен из выбранной подсказки, так что
 * лишний резолв по строке только добавлял бы риск попасть в город-тёзку.
 */
export async function calculateDeliveryCost(input: CalculateDeliveryCostInput): Promise<CdekTariff> {
  const packages = deriveShipmentPackages(input.items);
  return calculateCdekTariff({
    cityCode: input.cityCode,
    type: input.type,
    packages,
  });
}
