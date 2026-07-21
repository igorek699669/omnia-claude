import { getPayload } from "payload";
import config from "@payload-config";
import type { Product } from "../model/types";

/**
 * Ручная форма документа products из Payload — без зависимости от payload-types.ts
 * (генерация типов через CLI сейчас недоступна на Windows, см. payloadcms/payload#16378).
 */
interface ProductDoc {
  id: number | string;
  slug: string;
  name: string;
  soundCharacter: string;
  scale: string;
  scaleNotes: string;
  price: number;
  oldPrice?: number | null;
  notesCount: number;
  weightGrams: number;
  diameterCm: number;
  material: string;
  inStock?: boolean | null;
}

function toProduct(doc: ProductDoc): Product {
  return {
    id: String(doc.id),
    slug: doc.slug,
    name: doc.name,
    soundCharacter: doc.soundCharacter,
    scale: doc.scale,
    scaleNotes: doc.scaleNotes,
    price: doc.price,
    oldPrice: doc.oldPrice ?? undefined,
    notesCount: doc.notesCount,
    weightGrams: doc.weightGrams,
    diameterCm: doc.diameterCm,
    material: doc.material,
    inStock: doc.inStock ?? true,
  };
}

export async function getProducts(): Promise<Product[]> {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "products",
    limit: 100,
    sort: "-createdAt",
  });
  return (result.docs as ProductDoc[]).map(toProduct);
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
