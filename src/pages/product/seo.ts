import type { Metadata } from "next";
import {
  getProductBySlug,
  notesWord,
  parseProductName,
  HANDPAN_MATERIAL,
  HANDPAN_WEIGHT_GRAMS,
  HANDPAN_DIAMETER_CM,
  type Product,
} from "@/entities/product";
import { formatPrice, siteUrl, DEFAULT_OG_IMAGE } from "@/shared/lib";

/** Замер по 34 сайтам: длиннее 64 знаков выдача режет всегда, рабочий запас — 55–62. */
const TITLE_LIMIT = 62;

/** «Ханг D Kurd 11 — 11 нот, ре минор, 87 990 ₽» — модель, размер, строй и цена. */
function title(product: Product): string {
  const { model, scaleRu } = parseProductName(product.name);
  const notes = `${product.notesCount} ${notesWord(product.notesCount)}`;
  const short = `Ханг ${model} — ${notes}, ${formatPrice(product.price)}`;
  const full = scaleRu ? `Ханг ${model} — ${notes}, ${scaleRu}, ${formatPrice(product.price)}` : short;

  // «фа-диез румынский хиджаз» в лимит не влезает. Жертвуем переводом строя, а не ценой:
  // цену прямо в выдаче показывают единицы, и она отличает нас сильнее.
  return full.length <= TITLE_LIMIT ? full : short;
}

/**
 * Описание для выдачи и превью ссылки. Держим 180–240 знаков и главное в первых 120: Яндекс
 * берёт описание дословно примерно у каждой восьмой страницы, в остальных режет свой кусок.
 */
function describe(product: Product): string {
  const { model, scaleRu } = parseProductName(product.name);
  const notes = `${product.notesCount} ${notesWord(product.notesCount)}`;
  const scale = scaleRu ? `звукоряд ${scaleRu}, ` : "";
  const weightKg = (HANDPAN_WEIGHT_GRAMS / 1000).toLocaleString("ru-RU");

  return [
    `Ханг ${model}: ${notes}, ${scale}${product.tuningHz} Гц, цена ${formatPrice(product.price)}.`,
    `${HANDPAN_MATERIAL}, диаметр ${HANDPAN_DIAMETER_CM} см, вес ${weightKg} кг, ручная настройка каждой ноты.`,
    product.inStock ? "Есть в наличии," : "Делаем под заказ,",
    "защитный чехол в комплекте, доставка СДЭК по России.",
  ].join(" ");
}

/** Метаданные карточки. В слайсе, а не в app/: роут по правилу проекта — одна строка. */
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
    // absolute — иначе шаблон layout добавит « — Omnia», а это восемь знаков из лимита.
    title: { absolute: title(product) },
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${product.name} — Omnia`,
      description,
      url,
      // Свой кадр вместо общей картинки сайта. Фолбэк явно: Next заменяет родительский
      // openGraph целиком, и без этой строки товар без фото остался бы без превью.
      images: product.media[0]
        ? [{ url: product.media[0].url, alt: product.media[0].alt }]
        : [DEFAULT_OG_IMAGE],
    },
  };
}

/** Разметка Product: без неё в выдаче только заголовок, с ней — цена и «в наличии». */
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
      // BackOrder, а не OutOfStock: при «нет в наличии» Яндекс не показывает цену, а на
      // экране у такого товара и так стоит «Под заказ» — расхождения с разметкой нет.
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/BackOrder",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "Omnia" },
    },
  };

  // Экранируем «<»: название приходит из админки и закрывающим тегом оборвало бы <script>.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
