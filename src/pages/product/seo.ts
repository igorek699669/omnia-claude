import type { Metadata } from "next";
import {
  getProductBySlug,
  HANDPAN_MATERIAL,
  HANDPAN_WEIGHT_GRAMS,
  HANDPAN_DIAMETER_CM,
  type Product,
} from "@/entities/product";
import { formatPrice, siteUrl, DEFAULT_OG_IMAGE } from "@/shared/lib";

/** Описание, которое видно и в выдаче, и в превью ссылки, — из реальных полей инструмента. */
function describe(product: Product): string {
  return [
    `${product.name} — ханг ручной работы.`,
    `Строй ${product.scaleNotes}, ${product.notesCount} нот, ${product.tuningHz} Hz.`,
    `${formatPrice(product.price)}.`,
    "Доставка СДЭК по России.",
  ].join(" ");
}

/**
 * Метаданные карточки товара. Живут в слайсе, а не в app/: по правилу проекта роут — одна
 * строка ре-экспорта, а данные для заголовка всё равно тянутся тем же getProductBySlug.
 */
export async function generateProductMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Инструмент не найден" };

  const description = describe(product);
  const url = `/product/${product.slug}`;

  return {
    title: product.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${product.name} — Omnia`,
      description,
      url,
      // Свой кадр инструмента вместо общей картинки сайта: в ленте видно именно то, чем
      // делятся. Фолбэк указываем явно — Next заменяет родительский openGraph целиком,
      // а не дополняет его, и без этой строки карточка без фото осталась бы без превью.
      images: product.media[0]
        ? [{ url: product.media[0].url, alt: product.media[0].alt }]
        : [DEFAULT_OG_IMAGE],
    },
  };
}

/**
 * Разметка Product для поисковиков: цена, наличие и характеристики отдельными полями.
 * Без неё выдача показывает только заголовок, с ней — цену и «в наличии» прямо в сниппете.
 */
export function productJsonLd(product: Product): string {
  const base = siteUrl();

  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: describe(product),
    sku: product.id,
    image: product.media.map((media) => new URL(media.url, base).toString()),
    brand: { "@type": "Brand", name: "Omnia" },
    material: HANDPAN_MATERIAL,
    weight: { "@type": "QuantitativeValue", value: HANDPAN_WEIGHT_GRAMS, unitCode: "GRM" },
    width: { "@type": "QuantitativeValue", value: HANDPAN_DIAMETER_CM, unitCode: "CMT" },
    offers: {
      "@type": "Offer",
      url: new URL(`/product/${product.slug}`, base).toString(),
      priceCurrency: "RUB",
      price: product.price,
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "Omnia" },
    },
  };

  // Разметка уходит внутрь <script>, поэтому «<» экранируем: название товара приходит из
  // админки, и закрывающий тег в нём оборвал бы скрипт.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
