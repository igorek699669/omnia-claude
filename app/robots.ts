import type { MetadataRoute } from "next";

/**
 * Сайт закрыт от индексации целиком — снять запрет в день запуска, не раньше.
 *
 * Лежит в app/, а не в app/(app)/, хотя весь магазин живёт в группе: из группы Next 16
 * этот файл не собирает вовсе — маршрута /robots.txt в сборке нет, и запрет не работает
 * (проверено сборкой в обеих позициях). sitemap.ts из группы при этом собирается.
 * Не переносить обратно.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
