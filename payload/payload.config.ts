import path from "node:path";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import { Users } from "./collections/Users";
import { Media } from "./collections/Media";
import { Categories } from "./collections/Categories";
import { Products } from "./collections/Products";
import { Orders } from "./collections/Orders";

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Users, Media, Categories, Products, Orders],
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
    // через drizzle push, а не закоммиченные файлы миграций — CLI `payload migrate`/
    // `migrate:create` сейчас сломан (upstream-баг tsx-загрузчика Payload —
    // ERR_REQUIRE_ASYNC_MODULE/ERR_REQUIRE_ESM, воспроизводится и на Windows, и в Linux,
    // см. payloadcms/payload#16378). push срабатывает только при NODE_ENV !== "production"
    // (см. @payloadcms/db-postgres/dist/connect.js) — поэтому шаг миграции в деплое
    // (docker/migrate.sh) поднимает `next dev` на секунду, а не прод-сервер. Раз это
    // соло-проект на ранней стадии — push без журнала миграций приемлемый компромисс.
    push: true,
  }),
  typescript: {
    outputFile: path.resolve(process.cwd(), "payload/payload-types.ts"),
  },
});
