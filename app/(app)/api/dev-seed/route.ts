import { getPayload } from "payload";
import config from "@payload-config";
import { runSeed, attachProductPhotos } from "../../../../payload/seed";

/**
 * Ручной триггер наполнения каталога.
 *
 * Зачем роут, а не CLI: `npm run payload:seed` (как и `payload migrate`) на Next.js 16
 * падает в payload/dist/bin/loadEnv.js (payloadcms/payload#16378) — внутри же процесса
 * Next всё резолвится нормально. Поэтому дёргается по HTTP из docker/migrate.sh,
 * который для этого и так поднимает `next dev`.
 *
 * Режим задаётся переменной SEED, её передают вручную разовому запуску migrate
 * (`run --rm -e SEED=photos migrate`). Прод-контейнер `app` её не получает, поэтому
 * снаружи роут отвечает 404 и каталог случайно не тронуть.
 *
 *   SEED=photos — проставить товарам фото, ничего не удаляя. Рабочий режим для прода.
 *   SEED=1      — ⚠️ полный пересид: удаляет ВСЕ products и media. Только для пустой
 *                 базы — там, где есть заказы, удаление упрётся в NOT NULL на
 *                 orders_items.product_id и откатится.
 */
export async function POST() {
  const mode = process.env.SEED;
  if (mode !== "1" && mode !== "photos") {
    return new Response("Not found", { status: 404 });
  }

  const payload = await getPayload({ config });

  if (mode === "photos") {
    const result = await attachProductPhotos(payload);
    return Response.json({ ok: true, ...result });
  }

  await runSeed(payload);
  return Response.json({ ok: true });
}
