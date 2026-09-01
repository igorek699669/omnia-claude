import { headers as nextHeaders } from "next/headers";
import { getPayload } from "payload";
import type { BasePayload, Where } from "payload";
import config from "@payload-config";
import type { Product } from "../model/types";

/**
 * Ручная форма документа products — без зависимости от payload-types.ts: генерация типов
 * через CLI недоступна на Windows (payloadcms/payload#16378).
 */
interface MediaDoc {
  id: number | string;
  url?: string | null;
  alt?: string | null;
}

interface ProductDoc {
  id: number | string;
  slug: string;
  name: string;
  scaleNotes: string;
  price: number;
  oldPrice?: number | null;
  notesCount: number;
  tuningHz: "440" | "432";
  stockQty?: number | null;
  inStock?: boolean | null;
  hidden?: boolean | null;
  audioSample?: string | null;
  media?: (MediaDoc | number | string)[] | null;
}

function toProduct(doc: ProductDoc): Product {
  return {
    id: String(doc.id),
    slug: doc.slug,
    name: doc.name,
    scaleNotes: doc.scaleNotes,
    price: doc.price,
    oldPrice: doc.oldPrice ?? undefined,
    notesCount: doc.notesCount,
    tuningHz: doc.tuningHz,
    stockQty: doc.stockQty ?? 0,
    inStock: doc.inStock ?? true,
    audioSample: doc.audioSample ?? undefined,
    media: (doc.media ?? [])
      .filter((m): m is MediaDoc => typeof m === "object" && m !== null && !!m.url)
      .map((m) => ({ url: m.url as string, alt: m.alt ?? doc.name })),
  };
}

/**
 * Снятый с продажи товар (чекбокс «Скрыт из каталога» в Payload) не показывается на витрине
 * никому и никогда. Удалить его нельзя — он есть в заказах, а в них от позиции остаётся
 * только ссылка на товар (см. beforeDelete в payload/collections/Products.ts).
 *
 * not_equals не режет NULL: у товаров, заведённых до появления поля, колонка пустая, и они
 * должны остаться видимыми.
 */
const NOT_HIDDEN: Where = { hidden: { not_equals: true } };

/** Черновик (`adminOnly`) — виден на сайте только тому, кто вошёл в админ-панель. */
const NOT_DRAFT: Where = { adminOnly: { not_equals: true } };

/**
 * Открыта ли у посетителя сессия админ-панели. Проверяем тем же `payload.auth`, что и сама
 * админка: она кладёт свою куку `payload-token`, и подделать её не проще, чем войти. Ошибку
 * гасим — «не смогли проверить» это «обычный посетитель», а не повод уронить витрину.
 *
 * Читает заголовки запроса, поэтому вызывающие страницы обязаны рендериться динамически
 * (все, где это используется, и так `ƒ`): иначе кука не видна и черновик покажется всем.
 */
async function isAdminViewer(payload: BasePayload): Promise<boolean> {
  try {
    const { user } = await payload.auth({ headers: await nextHeaders() });
    return Boolean(user);
  } catch {
    return false;
  }
}

/** Что вообще можно показать этому посетителю: админу — ещё и черновики. */
async function visibleWhere(payload: BasePayload): Promise<Where> {
  return (await isAdminViewer(payload)) ? NOT_HIDDEN : { and: [NOT_HIDDEN, NOT_DRAFT] };
}

export async function getProducts(filters?: {
  tuningHz?: "440" | "432";
  /** Для карты сайта: черновики не должны попадать в неё даже когда её открыл админ. */
  publicOnly?: boolean;
}): Promise<Product[]> {
  const payload = await getPayload({ config });
  const visible = filters?.publicOnly ? { and: [NOT_HIDDEN, NOT_DRAFT] } : await visibleWhere(payload);
  const result = await payload.find({
    collection: "products",
    where: filters?.tuningHz ? { and: [visible, { tuningHz: { equals: filters.tuningHz } }] } : visible,
    limit: 100,
    sort: "-createdAt",
  });
  return (result.docs as ProductDoc[]).map(toProduct);
}

export interface CatalogFilters {
  q?: string;
  priceMin?: number;
  priceMax?: number;
  notesMin?: number;
  notesMax?: number;
  page?: number;
  limit?: number;
}

export interface CatalogResult {
  docs: Product[];
  page: number;
  totalPages: number;
  totalDocs: number;
}

/** Каталог с поиском, диапазонами цены/нот и постраничной навигацией — для CatalogPage. */
export async function getCatalogProducts(filters: CatalogFilters = {}): Promise<CatalogResult> {
  const payload = await getPayload({ config });

  const and: Where[] = [await visibleWhere(payload)];
  const q = filters.q?.trim();
  if (q && q.length >= 2) {
    and.push({ or: [{ name: { contains: q } }, { scaleNotes: { contains: q } }] });
  }
  if (filters.priceMin != null) and.push({ price: { greater_than_equal: filters.priceMin } });
  if (filters.priceMax != null) and.push({ price: { less_than_equal: filters.priceMax } });
  if (filters.notesMin != null) and.push({ notesCount: { greater_than_equal: filters.notesMin } });
  if (filters.notesMax != null) and.push({ notesCount: { less_than_equal: filters.notesMax } });

  const result = await payload.find({
    collection: "products",
    where: { and },
    // Товары без остатка — в конец списка, доступные показываются первыми.
    // Local API не разбивает строку по запятой на несколько полей (в отличие от REST) — нужен массив.
    sort: ["-inStock", "-createdAt"],
    page: filters.page ?? 1,
    limit: filters.limit ?? 12,
  });

  return {
    docs: (result.docs as ProductDoc[]).map(toProduct),
    page: result.page ?? 1,
    totalPages: result.totalPages ?? 1,
    totalDocs: result.totalDocs ?? 0,
  };
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "products",
    where: { and: [await visibleWhere(payload), { slug: { equals: slug } }] },
    limit: 1,
  });
  const doc = result.docs[0] as ProductDoc | undefined;
  return doc ? toProduct(doc) : undefined;
}
