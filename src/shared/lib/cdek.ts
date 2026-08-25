import { unstable_cache } from "next/cache";
import { PACKAGE_WEIGHT_GRAMS, type PackageBox } from "./shipment-package";

/**
 * СДЭК API v2 — https://apidoc.cdek.ru/. Набор доступных tariff_code различается между
 * контурами/договорами (напрямую проверено: 136/138 недоступны на тестовом контуре —
 * калькулятор возвращает err_result_service_empty), поэтому вместо захардкоженного кода
 * запрашиваем /calculator/tarifflist и берём самый дешёвый тариф нужного delivery_mode:
 * 4 — «склад-склад» (продавец и получатель — оба через ПВЗ), 3 — «склад-дверь»
 * (продавец сдаёт в ПВЗ, получателю — курьером). «Дверь» на стороне продавца (1/2) не
 * используем — потребовал бы точный адрес склада, а не только город.
 */
const PVZ_DELIVERY_MODE = 4;
const COURIER_DELIVERY_MODE = 3;

// Единственный склад продавца — Брянск (код города СДЭК, см. /v2/location/cities?city=Брянск).
const SENDER_CITY_CODE = 220;

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
  // Пока сознательно тестовый контур даже в проде — см. CDEK_API_URL в .env.example.
  return process.env.CDEK_API_URL ?? "https://api.edu.cdek.ru/v2";
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
 * Подсказки городов по неполному вводу — /location/suggest/cities.
 *
 * Не путать с /location/cities?city=...: тот матчит только полное название («Брянск» →
 * есть, «бря» → пусто, проверено эмпирически). Раньше из-за этого справочник тянулся
 * целиком и фильтровался у нас, но фильтра по наличию ПВЗ у /location/cities нет
 * (`have_cdekpvz` СДЭК молча игнорирует), так что «целиком» — это 135 тысяч населённых
 * пунктов и ~48 МБ JSON. В Data Cache такая запись не влезает (лимит 2 МБ на запись),
 * Next её тихо отбрасывал, и вся постраничная выгрузка повторялась на каждый ввод.
 *
 * suggest отдаёт десяток релевантных вариантов и сразу с настоящим code — кешировать
 * есть смысл уже поштучно, по строке запроса (unstable_cache включает аргументы в ключ).
 */
async function fetchCdekCitySuggestions(query: string): Promise<CdekCityMatch[]> {
  const items = await cdekFetch<CdekCitySuggestion[]>(
    `/location/suggest/cities?country_code=RU&name=${encodeURIComponent(query)}`,
  );
  return items.map(({ code, full_name }) => {
    // «Город, [район,] [регион,] Россия» — регион идёт предпоследним сегментом, а у
    // городов федерального значения его нет вовсе («Москва, Россия»).
    const parts = full_name.split(",").map((part) => part.trim());
    return { code, city: parts[0], region: parts.length > 2 ? parts[parts.length - 2] : undefined };
  });
}

// Кешируем через Data Cache Next.js (а не в переменной модуля): справочник СДЭК почти не
// меняется, а serverless-инстансов на проде несколько и они пересоздаются на каждый деплой.
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
        // Не задокументировано во всех версиях ответа СДЭК — на практике либо есть
        // готовый полный адрес с городом, либо приходится собирать его самим (ниже).
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
 * Пункт выдачи по его коду — ровно в том объёме, в котором он нужен чекауту.
 *
 * Зачем: код ПВЗ и код города приходят из браузера двумя независимыми полями, а тариф
 * считается по городу. Без сверки можно назвать город рядом с отправителем (дёшево), а
 * пункт выдачи выбрать во Владивостоке — отправление зарегистрируется по delivery_point,
 * и реальный счёт от СДЭК придёт мастерской.
 *
 * Три исхода различаются намеренно:
 *   null              — пункта с таким кодом у СДЭК нет, код выдуман;
 *   { cityCode: null} — пункт есть, но города в ответе не оказалось;
 *   { cityCode: N }   — можно сверять.
 * Средний случай существует потому, что `city_code` в ответе /deliverypoints не удалось
 * подтвердить эмпирически (песочница СДЭК лежала). Вызывающий на нём не должен отклонять
 * заказ: неизвестность — не доказательство подмены.
 */
export async function findCdekPvz(pvzCode: string): Promise<{ cityCode: number | null } | null> {
  const points = await cdekFetch<{ location?: { city_code?: number } }[]>(
    `/deliverypoints?code=${encodeURIComponent(pvzCode)}`,
  );
  const point = points[0];
  if (!point) return null;
  return { cityCode: point.location?.city_code ?? null };
}

export interface CdekTariff {
  /** Код выбранного тарифа — при регистрации отправления нужен ровно тот, по которому посчитали цену покупателю. */
  tariffCode: number;
  cost: number;
}

export async function calculateCdekTariff(params: {
  cityCode: number;
  type: "pvz" | "courier";
  packages: PackageBox[];
}): Promise<CdekTariff> {
  const result = await cdekFetch<{
    tariff_codes: { tariff_code: number; delivery_mode: number; delivery_sum: number }[];
  }>("/calculator/tarifflist", {
    method: "POST",
    body: JSON.stringify({
      type: 1,
      from_location: { code: SENDER_CITY_CODE },
      to_location: { code: params.cityCode },
      packages: params.packages.map((p) => ({
        weight: p.weightGrams,
        length: p.boxCm.length,
        width: p.boxCm.width,
        height: p.boxCm.height,
      })),
    }),
  });

  const wantedMode = params.type === "pvz" ? PVZ_DELIVERY_MODE : COURIER_DELIVERY_MODE;
  const matching = result.tariff_codes.filter((t) => t.delivery_mode === wantedMode);
  if (matching.length === 0) {
    throw new Error("СДЭК: нет доступных тарифов для этого направления");
  }
  const cheapest = matching.reduce((min, t) => (t.delivery_sum < min.delivery_sum ? t : min));
  return { tariffCode: cheapest.tariff_code, cost: cheapest.delivery_sum };
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
 * Регистрация отправления — POST /v2/orders. Заказ создаётся асинхронно: ответ отдаёт
 * только uuid и статус заявки, номер накладной (cdek_number) появляется позже, поэтому
 * его забирает отдельный getCdekOrderNumber.
 *
 * Товар уже оплачен через ЮKassa, поэтому наложенный платёж по каждой позиции — 0.
 * В items.cost идёт реальная цена: это объявленная стоимость (страховка), занижать её
 * для дорогого инструмента нельзя — при утере СДЭК возместит только объявленное.
 */
export async function createCdekOrder(params: CreateCdekOrderParams): Promise<string> {
  // Одна коробка на инструмент (см. deriveShipmentPackages), но вложения СДЭК требует
  // перечислить внутри места. Кладём весь состав заказа в первое место: дробить позиции
  // по коробкам смысла нет — вес и габариты у всех мест одинаковые.
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

  // Тарифы, которыми мы пользуемся, — оба «от склада»: продавец сам привозит груз в ПВЗ.
  // Если код своего пункта приёма задан в .env — отдаём его; иначе СДЭК примет город
  // отправителя и выберет пункт сам (from_location и shipment_point взаимоисключающие).
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

/**
 * Номер накладной по uuid. Заказ обрабатывается асинхронно, поэтому сразу после создания
 * номера может ещё не быть — тогда возвращаем null, а не считаем это ошибкой.
 */
export async function getCdekOrderNumber(uuid: string): Promise<string | null> {
  const result = await cdekFetch<{ entity?: { cdek_number?: string } }>(`/orders/${uuid}`);
  return result.entity?.cdek_number ?? null;
}
