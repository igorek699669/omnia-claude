"use server";

import { getPayload } from "payload";
import config from "@payload-config";
import { suggestCdekCities, getCdekPvzPoints, calculateCdekTariff, deriveShipmentPackages } from "@/shared/lib";
import type { CdekCityMatch, CdekTariff } from "@/shared/lib";
import { CITY_SEARCH_MIN_CHARS } from "../model/types";
import { TOP_RU_CITIES } from "../model/topCities";
import type { DeliveryType, Pvz } from "../model/types";

function normalizeCityName(text: string): string {
  return text.trim().toLowerCase().replace(/ё/g, "е");
}

// /location/cities матчит только полные названия, поэтому подсказки берём с
// /location/suggest/cities — он понимает неполный ввод и сразу отдаёт настоящий code.
export async function searchCitySuggestions(query: string): Promise<CdekCityMatch[]> {
  const q = normalizeCityName(query);
  if (q.length < CITY_SEARCH_MIN_CHARS) return [];

  const cities = await suggestCdekCities(q);

  // Топ-50 по населению — всегда выше остальных: СДЭК ранжирует по-своему, и рядом с
  // «Брянском» легко всплывает посёлок «Брянка».
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
 * отправление, и он обязан совпадать с тем, по которому показали цену. Город принимаем
 * кодом — он известен из выбранной подсказки, а резолв по строке попал бы в город-тёзку.
 */
export async function calculateDeliveryCost(input: CalculateDeliveryCostInput): Promise<CdekTariff> {
  const packages = deriveShipmentPackages(input.items);
  return calculateCdekTariff({
    cityCode: input.cityCode,
    type: input.type,
    packages,
    declaredValue: await declaredValueOf(input.items),
  });
}

/**
 * Объявленная стоимость вложения — сумма товаров по ценам из Payload: она уходит в страховой
 * сбор СДЭК, то есть влияет на деньги, а из корзины сюда приходят только id и количество.
 *
 * Товара с таким id может уже не быть — считаем его нулём и молчим: наличие и цену проверит
 * createOrderPayment, а расчёт доставки не место для отказа в заказе.
 */
async function declaredValueOf(items: CalculateDeliveryCostInput["items"]): Promise<number> {
  const payload = await getPayload({ config });
  let total = 0;
  for (const item of items) {
    try {
      const doc = (await payload.findByID({ collection: "products", id: item.productId })) as {
        price?: number | null;
      };
      total += (doc.price ?? 0) * item.qty;
    } catch {
      // товара нет — вклад в объявленную стоимость нулевой
    }
  }
  return total;
}
