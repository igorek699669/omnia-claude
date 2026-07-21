export { HomePage as default } from "@/views/home";

// Главная показывает популярные products из Payload — рендерим по запросу, а не бейкаем в билд.
export const dynamic = "force-dynamic";
