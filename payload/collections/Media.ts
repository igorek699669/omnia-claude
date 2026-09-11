import path from "node:path";
import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: () => true,
  },
  upload: {
    staticDir: path.resolve(process.cwd(), "media"),
    mimeTypes: ["image/*", "video/*"],
    // Снимок прямо с телефона — это 4000 px и несколько мегабайт. Храним переведённым в
    // webp и ужатым по длинной стороне: next/image всё равно отдаёт webp, но пока он
    // оптимизирует оригинал впервые, покупатель ждёт именно эту распаковку. Видео правила
    // не касаются — sharp работает только с картинками.
    resizeOptions: { width: 2000, height: 2000, fit: "inside", withoutEnlargement: true },
    formatOptions: { format: "webp", options: { quality: 82 } },
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      localized: true,
    },
  ],
};
