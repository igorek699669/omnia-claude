/**
 * Рядом лежит payload/package.json с единственным полем {"type":"module"} — без него CLI
 * Payload (`payload migrate`, `generate:types`, `run`) падает с ERR_REQUIRE_ASYNC_MODULE.
 * Причина: в корневом package.json нет "type": "module", поэтому tsx грузит этот конфиг
 * как CJS и делает require() на @payloadcms/richtext-lexical, а там top-level await,
 * который Node из CJS не даёт подключить. Отдельный package.json переводит папку в ESM.
 * Удалять его нельзя, даже если кажется лишним.
 */
import path from "node:path";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { Categories } from "./collections/Categories";
import { Products } from "./collections/Products";
import { Orders } from "./collections/Orders";
import { StockSubscriptions } from "./collections/StockSubscriptions";
import { Consents } from "./collections/Consents";

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Users, Media, Categories, Products, Orders, StockSubscriptions, Consents],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET ?? "",
  localization: {
    locales: ["ru"],
    defaultLocale: "ru",
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
    // Отдельная схема — не смешивать с таблицами Better Auth (user/session/account в public).
    schemaName: "payload",
    // По умолчанию и так true (push !== false), но оставлено явно: схема синхронизируется
    // через drizzle push, а не закоммиченные файлы миграций. Для соло-проекта на ранней
    // стадии это осознанный компромисс — не выдумывать журнал миграций там, где схема
    // ещё меняется каждую неделю. `payload migrate:create`/`migrate` при этом рабочие
    // (см. payload/package.json), так что перейти на них можно в любой момент: понадобится
    // migrationDir на payload/migrations, push: false и CREATE SCHEMA payload первым шагом —
    // сгенерированная миграция саму схему не создаёт, в отличие от push.
    // push срабатывает только при NODE_ENV !== "production" (см. connect.js в
    // @payloadcms/db-postgres) — поэтому в деплое его запускает отдельный шаг
    // (`npm run deploy:migrate` в контейнере migrate), а не прод-сервер.
    push: true,
  }),
  typescript: {
    outputFile: path.resolve(process.cwd(), "payload/payload-types.ts"),
  },
});
