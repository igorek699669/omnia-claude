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

interface PackageBox {
  weightGrams: number;
  boxCm: { length: number; width: number; height: number };
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

export async function resolveCdekCityCode(city: string): Promise<number> {
  const cities = await cdekFetch<{ code: number; city: string }[]>(
    `/location/cities?city=${encodeURIComponent(city)}&size=1&country_codes=RU`,
  );
  const match = cities[0];
  if (!match) {
    throw new Error(`СДЭК: город «${city}» не найден`);
  }
  return match.code;
}

interface CityListCache {
  cities: CdekCityMatch[];
  expiresAt: number;
}

let cityListCache: CityListCache | null = null;
let cityListFetch: Promise<CdekCityMatch[]> | null = null;

// Справочник городов почти не меняется — держим в памяти процесса подольше.
const CITY_LIST_TTL_MS = 12 * 60 * 60 * 1000;
const CITY_PAGE_SIZE = 1000;
// Предохранитель от бесконечного цикла, если СДЭК когда-нибудь перестанет отдавать короткую последнюю страницу.
const CITY_MAX_PAGES = 200;

async function fetchAllCdekCities(): Promise<CdekCityMatch[]> {
  const all: CdekCityMatch[] = [];
  for (let page = 0; page < CITY_MAX_PAGES; page++) {
    // have_cdekpvz=true — иначе в справочник попадает вообще каждый населённый пункт РФ
    // (хутора, деревни), а не только те, где реально есть сеть ПВЗ. Без фильтра в подсказках
    // всплывают омонимы вроде «Брянск» в Дагестане (реальный хутор, но без единого ПВЗ) —
    // выбор такого пункта ломает загрузку карты, потому что точек выдачи для него просто нет.
    const batch = await cdekFetch<CdekCityMatch[]>(
      `/location/cities?size=${CITY_PAGE_SIZE}&page=${page}&country_codes=RU&have_cdekpvz=true`,
    );
    all.push(...batch);
    if (batch.length < CITY_PAGE_SIZE) break;
  }
  return all;
}

// Живой фильтр /location/cities?city=... матчит, судя по всему, только точные/начинающиеся
// с полного слова названия — на неполном вводе или опечатке отдаёт пустой список (проверено
// эмпирически). Поэтому вместо него тянем справочник целиком (кешируя в памяти процесса) и
// ищем подстроку сами — так подсказки работают от 3 букв независимо от качества их фильтра.
export async function getAllCdekCities(): Promise<CdekCityMatch[]> {
  if (cityListCache && cityListCache.expiresAt > Date.now()) {
    return cityListCache.cities;
  }
  if (!cityListFetch) {
    cityListFetch = fetchAllCdekCities()
      .then((cities) => {
        cityListCache = { cities, expiresAt: Date.now() + CITY_LIST_TTL_MS };
        return cities;
      })
      .finally(() => {
        cityListFetch = null;
      });
  }
  return cityListFetch;
}

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

export async function calculateCdekTariff(params: {
  cityCode: number;
  type: "pvz" | "courier";
  packages: PackageBox[];
}): Promise<number> {
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
  return Math.min(...matching.map((t) => t.delivery_sum));
}
