import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  // Next по умолчанию представляется заголовком X-Powered-By. Пользы от него нет, а
  // сканеру он экономит первый шаг — какой фреймворк и что под него искать.
  poweredByHeader: false,
  // Каталог сборки — переменной, чтобы E2E-прогон (e2e/scripts/serve.mjs) поднимал свой
  // next dev рядом с рабочим: Next отказывается запускать второй dev-сервер на тот же
  // distDir («Another next dev server is already running»), а лок лежит внутри него.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // AVIF на ~20–30% легче WebP при том же качестве; браузер без AVIF получит WebP.
  // Первое сжатие в AVIF дольше, но результат кешируется оптимизатором.
  images: { formats: ["image/avif", "image/webp"] },
  // experimental.inlineCss пробовали (21.09.2026) и не включаем: стили попадают в HTML
  // дважды — тегом <style> и ещё раз в RSC-данных, — это +~20 КБ сжатыми к каждой странице
  // и без кеша между переходами. Отдельный CSS-файл обходится дешевле.
};

// Расположение конфига (payload/payload.config.ts, а не дефолтный корневой) резолвится
// через алиас "@payload-config" в tsconfig.json paths — withPayload() в этой версии
// не принимает configPath, только devBundleServerPackages.
const config = withPayload(nextConfig);

// withPayload вешает на ВСЕ пути Accept-CH/Critical-CH: Sec-CH-Prefers-Color-Scheme — это
// нужно только админке, чтобы сразу отрисоваться в теме ОС. Но Critical-CH заставляет Chrome
// при первом заходе выбросить полученную страницу и запросить её заново уже с подсказкой:
// на витрине это лишний круг до сервера до первой отрисовки (~1 с на мобильном в PageSpeed,
// 21.09.2026). Сужаем правило до /admin, остальные заголовки не трогаем.
const payloadHeaders = config.headers;
config.headers = async () =>
  ((await payloadHeaders?.()) ?? []).map((rule) =>
    rule.headers.some((h) => h.key === "Critical-CH") ? { ...rule, source: "/admin/:path*" } : rule,
  );

export default config;
