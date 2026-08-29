import { unstable_cache } from "next/cache";
import { PACKAGE_WEIGHT_GRAMS, type PackageBox } from "./shipment-package";

/**
 * Набор доступных tariff_code различается между контурами и договорами (136/138 на
 * тестовом контуре недоступны), поэтому код не зашит: берём самый дешёвый тариф нужного
 * delivery_mode из /calculator/tarifflist. 4 — «склад-склад», 3 — «склад-дверь»; «дверь»
 * на стороне продавца потребовала бы точный адрес склада, а не только город.
 */
const PVZ_DELIVERY_MODE = 4;
const COURIER_DELIVERY_MODE = 3;

// Единственный склад продавца — Брянск (код города СДЭК, см. /v2/location/cities?city=Брянск).
const SENDER_CITY_CODE = 220;

/** Публичная страница отслеживания — тот же адрес нужен и в письме с треком. */
export function cdekTrackingUrl(cdekNumber: string): string {
  return `https://www.cdek.ru/ru/tracking?order_id=${encodeURIComponent(cdekNumber)}`;
}

export interface CdekPvz {
  code: string;
  city: string;
  address: string;
  lat: number;
  lon: number;
  workTime?: string;
}

export interface CdekCityMatch {
  code: number;
  city: string;
  region?: string;
}

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

function apiUrl(): string {
  return process.env.CDEK_API_URL || "https://api.edu.cdek.ru/v2";
}

async function getCdekToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken;
  }

  const clientId = process.env.CDEK_ACCOUNT;
  const clientSecret = process.env.CDEK_SECURE_PASSWORD;
  if (!clientId || !clientSecret) {
    throw new Error("СДЭК: CDEK_ACCOUNT/CDEK_SECURE_PASSWORD не заданы в .env.local");
  }

  const res = await fetch(`${apiUrl()}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) {
    throw new Error(`СДЭК: не удалось получить токен (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    accessToken: data.access_token,
    // Запас в 60 секунд на сетевую задержку до следующего запроса.
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return tokenCache.accessToken;
}

async function cdekFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getCdekToken();
  const res = await fetch(`${apiUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`СДЭК: запрос ${path} не удался (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

interface CdekCitySuggestion {
  code: number;
  /** Полное название с иерархией: «Брянск, городской округ Брянск, Брянская область, Россия». */
  full_name: string;
}

/**
 * Подсказки городов по неполному вводу. Не /location/cities: тот матчит только полное
 * название, а тянуть справочник целиком — 135 тысяч пунктов и ~48 МБ, что не влезает в
 * Data Cache (2 МБ на запись): Next молча отбрасывал запись и повторял выгрузку на каждый
 * ввод. suggest отдаёт десяток вариантов сразу с настоящим code.
 */
async function fetchCdekCitySuggestions(query: string): Promise<CdekCityMatch[]> {
  const items = await cdekFetch<CdekCitySuggestion[]>(
    `/location/suggest/cities?country_code=RU&name=${encodeURIComponent(query)}`,
  );
  return items.map(({ code, full_name }) => {
    // «Город, [район,] [регион,] Россия» — регион предпоследний, у городов федерального
    // значения его нет вовсе.
    const parts = full_name.split(",").map((part) => part.trim());
    return { code, city: parts[0], region: parts.length > 2 ? parts[parts.length - 2] : undefined };
  });
}

// Data Cache, а не переменная модуля: инстансов на проде несколько и они пересоздаются
// на каждый деплой.
export const suggestCdekCities = unstable_cache(fetchCdekCitySuggestions, ["cdek-city-suggest"], {
  revalidate: 60 * 60 * 24,
});

export async function getCdekPvzPoints(cityCode: number): Promise<CdekPvz[]> {
  const points = await cdekFetch<
    {
      code: string;
      location: {
        city: string;
        region?: string;
        address: string;
        // Есть не во всех ответах — тогда собираем адрес сами (ниже).
        address_full?: string;
        longitude: number;
        latitude: number;
      };
      work_time?: string;
    }[]
  >(`/deliverypoints?city_code=${cityCode}&type=PVZ`);

  return points
    .filter((p) => Number.isFinite(p.location.latitude) && Number.isFinite(p.location.longitude))
    .map((p) => ({
      code: p.code,
      city: p.location.city,
      address: p.location.address_full || `${p.location.city}, ${p.location.address}`,
      lat: p.location.latitude,
      lon: p.location.longitude,
      workTime: p.work_time,
    }));
}

/**
 * Пункт выдачи по коду — для сверки с городом. Код ПВЗ и код города приходят из браузера
 * двумя независимыми полями, а тариф считается по городу: без сверки можно назвать город
 * рядом с отправителем, а пункт выбрать во Владивостоке — счёт от СДЭК придёт мастерской.
 *
 * null — пункта с таким кодом нет; { cityCode: null } — пункт есть, но города в ответе не
 * оказалось: на этом заказ не отклоняем, неизвестность не доказывает подмену.
 */
export async function findCdekPvz(pvzCode: string): Promise<{ cityCode: number | null } | null> {
  const points = await cdekFetch<{ location?: { city_code?: number } }[]>(
    `/deliverypoints?code=${encodeURIComponent(pvzCode)}`,
  );
  const point = points[0];
  if (!point) return null;
  return { cityCode: point.location?.city_code ?? null };
}

async function fetchCheapestTariffCode(
  cityCode: number,
  mode: number,
  packages: { weight: number; length: number; width: number; height: number }[],
): Promise<number> {
  const result = await cdekFetch<{
    tariff_codes: { tariff_code: number; delivery_mode: number; delivery_sum: number }[];
  }>("/calculator/tarifflist", {
    method: "POST",
    body: JSON.stringify({
      type: 1,
      from_location: { code: SENDER_CITY_CODE },
      to_location: { code: cityCode },
      packages,
    }),
  });

  const matching = result.tariff_codes.filter((t) => t.delivery_mode === mode);
  if (matching.length === 0) {
    throw new Error("СДЭК: нет доступных тарифов для этого направления");
  }
  return matching.reduce((min, t) => (t.delivery_sum < min.delivery_sum ? t : min)).tariff_code;
}

// Тот же Data Cache, что и у справочника городов; аргументы входят в ключ.
const cheapestTariffCode = unstable_cache(fetchCheapestTariffCode, ["cdek-cheapest-tariff"], {
  revalidate: 60 * 60 * 24,
});

export interface CdekTariff {
  /** При регистрации отправления нужен ровно тот тариф, по которому посчитали цену. */
  tariffCode: number;
  /** Итог к оплате покупателем: доставка вместе со страховкой объявленной стоимости. */
  cost: number;
}

/**
 * Стоимость доставки для покупателя — через /calculator/tariff, а не tarifflist: список
 * тарифов не принимает услуг, поэтому страховка объявленной стоимости в его ответ не
 * попадает. Занижать объявленную нельзя (при утере СДЭК возместит только её), а сбор с
 * неё СДЭК выставляет мастерской — по списку он просто не доезжал до чека покупателя.
 */
export async function calculateCdekTariff(params: {
  cityCode: number;
  type: "pvz" | "courier";
  packages: PackageBox[];
  /** Объявленная стоимость вложения в рублях — сумма товаров заказа (без доставки). */
  declaredValue: number;
}): Promise<CdekTariff> {
  const packages = params.packages.map((p) => ({
    weight: p.weightGrams,
    length: p.boxCm.length,
    width: p.boxCm.width,
    height: p.boxCm.height,
  }));

  const mode = params.type === "pvz" ? PVZ_DELIVERY_MODE : COURIER_DELIVERY_MODE;
  const tariffCode = await cheapestTariffCode(params.cityCode, mode, packages);

  const priced = await cdekFetch<{ total_sum?: number; delivery_sum?: number }>("/calculator/tariff", {
    method: "POST",
    body: JSON.stringify({
      type: 1,
      tariff_code: tariffCode,
      from_location: { code: SENDER_CITY_CODE },
      to_location: { code: params.cityCode },
      packages,
      // parameter у услуг СДЭК всегда строка, даже когда это число.
      services: [{ code: "INSURANCE", parameter: String(Math.round(params.declaredValue)) }],
    }),
  });

  // total_sum — доставка с услугами; delivery_sum без страховки, на случай другого ответа.
  const cost = priced.total_sum ?? priced.delivery_sum;
  if (typeof cost !== "number") {
    throw new Error("СДЭК: расчёт тарифа не вернул сумму доставки");
  }
  return { tariffCode, cost };
}

export interface CdekOrderItem {
  /** Идентификатор товара в нашей системе — уходит в ware_key. */
  wareKey: string;
  name: string;
  qty: number;
  /** Цена за единицу в рублях — объявленная стоимость. */
  price: number;
}

export interface CreateCdekOrderParams {
  /** Наш номер заказа. СДЭК не даёт завести два заказа с одинаковым number — это и есть защита от дублей. */
  orderNumber: string;
  tariffCode: number;
  type: "pvz" | "courier";
  cityCode: number;
  /** Только для курьера: улица, дом, квартира. */
  address?: string;
  /** Только для ПВЗ: код пункта выдачи получателя. */
  pvzCode?: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  items: CdekOrderItem[];
  packages: PackageBox[];
}

/**
 * Регистрация отправления. Заказ создаётся асинхронно: в ответе только uuid, номер
 * накладной забирает getCdekOrderNumber позже.
 *
 * Наложенный платёж нулевой — товар уже оплачен. В items.cost реальная цена: это
 * объявленная стоимость, занижать её нельзя.
 */
export async function createCdekOrder(params: CreateCdekOrderParams): Promise<string> {
  // Вложения СДЭК требует перечислить внутри места. Кладём весь состав в первое: вес и
  // габариты у всех мест одинаковые (см. deriveShipmentPackages).
  const cdekItems = params.items.map((item) => ({
    ware_key: item.wareKey,
    name: item.name,
    payment: { value: 0 },
    cost: item.price,
    amount: item.qty,
    weight: PACKAGE_WEIGHT_GRAMS,
  }));

  const body: Record<string, unknown> = {
    type: 1,
    number: params.orderNumber,
    tariff_code: params.tariffCode,
    recipient: {
      name: params.recipientName,
      phones: [{ number: params.recipientPhone }],
      email: params.recipientEmail,
    },
    packages: params.packages.map((p, index) => ({
      number: String(index + 1),
      weight: p.weightGrams,
      length: p.boxCm.length,
      width: p.boxCm.width,
      height: p.boxCm.height,
      items: index === 0 ? cdekItems : [],
    })),
  };

  // Оба тарифа «от склада»: продавец сам привозит груз в ПВЗ. Без своего кода пункта
  // приёма СДЭК выберет его по городу (from_location и shipment_point взаимоисключающие).
  const shipmentPoint = process.env.CDEK_SHIPMENT_POINT;
  if (shipmentPoint) {
    body.shipment_point = shipmentPoint;
  } else {
    body.from_location = { code: SENDER_CITY_CODE };
  }

  if (params.type === "pvz") {
    body.delivery_point = params.pvzCode;
  } else {
    body.to_location = { code: params.cityCode, address: params.address };
  }

  const result = await cdekFetch<{
    entity?: { uuid?: string };
    requests?: { state?: string; errors?: { code?: string; message?: string }[] }[];
  }>("/orders", { method: "POST", body: JSON.stringify(body) });

  // HTTP 202 приходит и на отклонённую заявку — реальный результат лежит в requests[].state.
  const invalid = result.requests?.find((r) => r.state === "INVALID");
  if (invalid) {
    const reason = invalid.errors?.map((e) => e.message ?? e.code).join("; ") || "причина не указана";
    throw new Error(`СДЭК отклонил регистрацию заказа: ${reason}`);
  }

  const uuid = result.entity?.uuid;
  if (!uuid) {
    throw new Error("СДЭК: ответ на создание заказа не содержит uuid");
  }
  return uuid;
}

/** Номер накладной по uuid. Появляется не сразу — до этого null, и это не ошибка. */
export async function getCdekOrderNumber(uuid: string): Promise<string | null> {
  const result = await cdekFetch<{ entity?: { cdek_number?: string } }>(`/orders/${uuid}`);
  return result.entity?.cdek_number ?? null;
}
