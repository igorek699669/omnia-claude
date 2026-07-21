import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  output: "standalone",
};

// Расположение конфига (payload/payload.config.ts, а не дефолтный корневой) резолвится
// через алиас "@payload-config" в tsconfig.json paths — withPayload() в этой версии
// не принимает configPath, только devBundleServerPackages.
export default withPayload(nextConfig);
