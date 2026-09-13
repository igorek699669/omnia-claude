import type { MetadataRoute } from "next";
import { siteUrl } from "@/shared/lib";

/**
 * По запросу, а не на этапе сборки: адрес сайта приходит из окружения контейнера, а образ
 * собирается без него — запечённый robots.txt указывал бы карту сайта на localhost.
 */
export const dynamic = "force-dynamic";

/**
 * Сайт открыт для индексации. Закрыты только админка Payload и API — это не страницы.
 * Корзина, чекаут, вход и кабинет не запрещаются здесь, а помечены noindex в своих роутах:
 * запрет в robots.txt не дал бы краулеру увидеть этот noindex.
 *
 * Лежит в app/, а не в app/(app)/: из группы Next 16 этот файл не собирает вовсе — маршрута
 * /robots.txt в сборке нет. Не переносить.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    },
    sitemap: new URL("/sitemap.xml", siteUrl()).toString(),
  };
}
