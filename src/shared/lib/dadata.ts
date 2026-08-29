/**
 * Подсказки адресов ДаData поверх государственного реестра ГАР. Нужны там, где город уже
 * известен из справочника СДЭК, а улица и дом набираются руками: без сверки такой адрес
 * доезжает до СДЭК как есть и всплывает уже у курьера.
 *
 * Взят именно suggest, а не «Стандартизация» с её кодами качества: та требует второй,
 * секретный ключ, а нам достаточно ответа на вопрос «есть ли такой дом в этом городе».
 */
const SUGGEST_URL = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address";

export interface DadataAddress {
  /** Адрес без города — ровно то, что покупатель видит и правит в поле. */
  value: string;
  /** Полный адрес с городом и регионом: он уходит в СДЭК. */
  full: string;
  /** Разобрался ли адрес до дома. Улица без дома для курьера бесполезна. */
  hasHouse: boolean;
}

/** true — ключ есть и сверять адреса можно. Без ключа проверки просто нет. */
export function isDadataConfigured(): boolean {
  return Boolean(process.env.DADATA_API_KEY);
}

/**
 * Подсказки в пределах города. Пустой массив значит «не нашли» — это не то же самое, что
 * «адреса не существует»: у ДаData есть свои пробелы, и на них продажу рубить нельзя.
 */
export async function suggestDadataAddresses(
  city: string,
  query: string,
  count = 7,
): Promise<DadataAddress[]> {
  const token = process.env.DADATA_API_KEY;
  if (!token) {
    console.warn("[dadata] DADATA_API_KEY не задан в .env.local — подсказок адреса не будет");
    return [];
  }

  const res = await fetch(SUGGEST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({
      query,
      count,
      // Ищем только внутри выбранного города, а сам город в подсказку не повторяем:
      // в поле у покупателя остаётся «ул. Ленина, д 5».
      locations: [{ city }],
      restrict_value: true,
      from_bound: { value: "street" },
      to_bound: { value: "house" },
    }),
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    throw new Error(`ДаData: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as {
    suggestions?: { value?: string; unrestricted_value?: string; data?: { house?: string | null } }[];
  };

  return (data.suggestions ?? []).map((s) => ({
    value: s.value ?? "",
    full: s.unrestricted_value ?? s.value ?? "",
    hasHouse: Boolean(s.data?.house),
  }));
}
