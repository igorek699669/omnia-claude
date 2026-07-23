export { CatalogPage as default } from "@/views/catalog";

// Каталог читает products из Payload — рендерим по запросу, а не бейкаем в билд.
export const dynamic = "force-dynamic";
