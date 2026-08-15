"use server";

import { getAllCdekCities, getCdekPvzPoints, calculateCdekTariff, deriveShipmentPackages } from "@/shared/lib";
import type { CdekCityMatch, CdekTariff } from "@/shared/lib";
import { CITY_SEARCH_MIN_CHARS } from "../model/types";
import { TOP_RU_CITIES } from "../model/topCities";
import type { DeliveryType, Pvz } from "../model/types";

function normalizeCityName(text: string): string {
  return text.trim().toLowerCase().replace(/ё/g, "е");
}

// Первая загрузка полного справочника городов — постраничная (см. getAllCdekCities) и
// поэтому небыстрая. Дергаем её заранее, как только пользователь попал на оформление
// заказа, а не в момент, когда он уже открыл выбор доставки и начал печатать — тогда
// к этому моменту кеш (в памяти процесса, TTL 12ч) уже почти наверняка тёплый.
export async function warmUpCityCache(): Promise<void> {
  await getAllCdekCities();
}

// Живой фильтр СДЭК (/location/cities?city=...) матчит только точные/полные названия —
// на неполном вводе отдаёт пустой список. Поэтому справочник городов тянем целиком
// (см. getAllCdekCities — кешируется в памяти процесса) и ищем подстроку сами: так
// подсказки работают от 2 букв, а результат сразу приходит с настоящим code.
export async function searchCitySuggestions(query: string): Promise<CdekCityMatch[]> {
  const q = normalizeCityName(query);
  if (q.length < CITY_SEARCH_MIN_CHARS) return [];

  const cities = await getAllCdekCities();
  const matches: { city: CdekCityMatch; index: number; isTop: boolean }[] = [];
  for (const city of cities) {
    const index = normalizeCityName(city.city).indexOf(q);
    if (index === -1) continue;
    matches.push({ city, index, isTop: TOP_RU_CITIES.has(normalizeCityName(city.city)) });
  }

  // Города из топ-50 по населению — всегда выше остальных совпадений (мелкие тёзки и
  // посёлки менее релевантны для покупателя). Дальше как раньше: совпадения с начала
  // названия («Бря» → «Брянск») — выше тех, где строка встретилась в середине; при
  // равенстве — короче название вперёд (обычно оно и нужнее).
  matches.sort(
    (a, b) => Number(b.isTop) - Number(a.isTop) || a.index - b.index || a.city.city.length - b.city.city.length,
  );
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
