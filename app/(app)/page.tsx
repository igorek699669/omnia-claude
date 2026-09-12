import type { Metadata } from "next";

export { HomePage as default } from "@/pages/home";

// Главная показывает популярные products из Payload — рендерим по запросу, а не бейкаем в билд.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  // absolute: шаблон layout добавил бы « — Omnia» к строке, где имя мастерской уже есть.
  title: { absolute: "Ханги Omnia — купите хэндпан ручной работы от мастерской" },
  description:
    "Музыкальные инструменты из нержавеющей стали: строй, цены, количество нот и запись реального звучания каждого инструмента. Хендпаны под заказ, доставка СДЭК по России.",
  alternates: { canonical: "/" },
};
