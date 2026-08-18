import { getPayload } from "payload";
import config from "@payload-config";
import { runSeed } from "../../../../payload/seed";

/**
 * Ручной триггер пересидинга каталога.
 *
 * Зачем роут, а не CLI: `npm run payload:seed` (как и `payload migrate`) на Next.js 16
 * падает в payload/dist/bin/loadEnv.js (payloadcms/payload#16378) — внутри же процесса
 * Next всё резолвится нормально. Поэтому сид дёргается по HTTP из docker/migrate.sh,
 * который для этого и так поднимает `next dev`.
 *
 * Защита: работает только при SEED=1 в окружении. Прод-контейнер `app` эту переменную
 * не получает (её передают вручную сервису `migrate`: `run --rm -e SEED=1 migrate`),
 * так что снаружи роут отвечает 404 и каталог случайно не пересоздать.
 *
 * ⚠️ runSeed удаляет ВСЕ products и media перед созданием заново — ссылки
 * orders.items[].product в существующих заказах после этого станут битыми.
 */
export async function POST() {
  if (process.env.SEED !== "1") {
    return new Response("Not found", { status: 404 });
  }

  const payload = await getPayload({ config });
  await runSeed(payload);
  return Response.json({ ok: true });
}
