import { getPayload } from "payload";
import config from "./payload.config";

/**
 * Одноразовый перенос трёх исходных мок-товаров (см. историю src/entities/product/api/mock.ts)
 * в реальную БД, чтобы каталог не опустел после перехода на Payload Local API.
 * Запуск: npm run payload:seed
 */
const products = [
  {
    slug: "dancing-waves",
    name: "Танцующие волны",
    scaleNotes: "D3 / A3 B3 C4 D4 E4 F4 A4",
    price: 32000,
    oldPrice: 36000,
    notesCount: 9,
    tuningHz: "440",
    stockQty: 3,
  },
  {
    slug: "morning-mist",
    name: "Утренний туман",
    scaleNotes: "D3 / A3 C4 D4 E4 F4 G4 A4",
    price: 32000,
    oldPrice: 36000,
    notesCount: 9,
    tuningHz: "440",
    stockQty: 3,
  },
  {
    slug: "warm-current",
    name: "Тёплое течение",
    scaleNotes: "D3 / A3 Bb3 C#4 D4 E4 F4 A4",
    price: 32000,
    oldPrice: 36000,
    notesCount: 9,
    tuningHz: "440",
    stockQty: 3,
  },
  // Ниже — тестовые товары для проверки герцовки/остатков (фильтр каталога, notify-me).
  {
    slug: "moon-path",
    name: "Лунный путь",
    scaleNotes: "D3 / A3 Bb3 D4 E4 F4 A4",
    price: 34000,
    notesCount: 8,
    tuningHz: "432",
    stockQty: 0,
  },
  {
    slug: "northern-wind",
    name: "Северный ветер",
    scaleNotes: "D3 / A3 C4 D4 E4 F4 G4 A4 C5 D5",
    price: 39000,
    oldPrice: 43000,
    notesCount: 13,
    tuningHz: "432",
    stockQty: 5,
  },
  {
    slug: "fire-circle",
    name: "Огненный круг",
    scaleNotes: "D3 / A3 B3 D4 E4 F#4 A4 B4",
    price: 33000,
    notesCount: 10,
    tuningHz: "440",
    stockQty: 1,
  },
];

async function seed() {
  const payload = await getPayload({ config });

  for (const product of products) {
    const existing = await payload.find({
      collection: "products",
      where: { slug: { equals: product.slug } },
      limit: 1,
    });

    if (existing.docs.length > 0) {
      console.log(`Пропущено (уже есть): ${product.slug}`);
      continue;
    }

    await payload.create({ collection: "products", data: product });
    console.log(`Создано: ${product.slug}`);
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
