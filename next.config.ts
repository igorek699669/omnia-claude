import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  // Каталог сборки — переменной, чтобы E2E-прогон (e2e/scripts/serve.mjs) поднимал свой
  // next dev рядом с рабочим: Next отказывается запускать второй dev-сервер на тот же
  // distDir («Another next dev server is already running»), а лок лежит внутри него.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

// Расположение конфига (payload/payload.config.ts, а не дефолтный корневой) резолвится
// через алиас "@payload-config" в tsconfig.json paths — withPayload() в этой версии
// не принимает configPath, только devBundleServerPackages.
export default withPayload(nextConfig);
