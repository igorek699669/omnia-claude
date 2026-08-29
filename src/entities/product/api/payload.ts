import { getPayload } from "payload";
import type { Where } from "payload";
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

export async function getProducts(filters?: { tuningHz?: "440" | "432" }): Promise<Product[]> {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "products",
    where: filters?.tuningHz ? { tuningHz: { equals: filters.tuningHz } } : undefined,
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

  const and: Where[] = [];
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
    where: and.length ? { and } : undefined,
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
    where: { slug: { equals: slug } },
    limit: 1,
  });
  const doc = result.docs[0] as ProductDoc | undefined;
  return doc ? toProduct(doc) : undefined;
}
