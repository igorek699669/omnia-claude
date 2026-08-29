import type { MetadataRoute } from "next";
import { getProducts } from "@/entities/product";
import { siteUrl } from "@/shared/lib";

/**
 * По запросу, а не на этапе сборки: образ собирается без доступа к базе, и запечённая карта
 * уехала бы в прод без товаров. Краулеры ходят редко — запрос в Payload ничего не стоит.
 */
export const dynamic = "force-dynamic";

/**
 * Карта сайта: статические страницы плюс карточки товаров из Payload. Корзина, чекаут, вход
 * и кабинет сюда не попадают — это личные страницы, помеченные noindex в своих роутах.
 *
 * lastModified не проставляем: даты изменения у Product наружу нет, а «сегодня» каждому
 * товару — враньё поисковику о свежести.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const pages: { path: string; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/catalog", priority: 0.9 },
    { path: "/delivery", priority: 0.6 },
    { path: "/requisites", priority: 0.4 },
    { path: "/oferta", priority: 0.3 },
    { path: "/return", priority: 0.3 },
    { path: "/privacy", priority: 0.2 },
    { path: "/terms", priority: 0.2 },
    { path: "/cookie-policy", priority: 0.2 },
  ];

  const staticEntries = pages.map(({ path, priority }) => ({
    url: new URL(path || "/", base).toString(),
    priority,
  }));

  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const products = await getProducts();
    productEntries = products.map((product) => ({
      url: new URL(`/product/${product.slug}`, base).toString(),
      priority: 0.8,
    }));
  } catch (err) {
    console.error("[sitemap] не удалось получить товары:", err);
  }

  return [...staticEntries, ...productEntries];
}
