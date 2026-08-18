import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload, type Payload } from "payload";
import config from "./payload.config";

/**
 * Каталог хангов, собранный по реальным аудиозаписям строёв из public/audio/.
 * scaleNotes рассчитаны по интервальным формулам строёв (Kurd, Hijaz, Pygmy,
 * Ashakiran, Amara, Equinox, Romanian Hijaz) от корневой ноты в названии файла;
 * "+N" в названии — нижние ноты, notesCount = верхние + нижние.
 * Запуск: npm run payload:seed (старые товары при этом удаляются).
 */
const products = [
  {
    slug: "a-hijaz-14",
    name: "Ханг A Hijaz 14",
    scaleNotes: "A2 / A#2 B2 E3 F3 G3 A3 A#3 C#4 D4 E4 F4 G4 A4",
    price: 111990,
    oldPrice: 167990,
    notesCount: 14,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/A2_Hijaz_14.m4a",
  },
  {
    slug: "c-sharp-kurd-20",
    name: "Ханг C# Kurd 20",
    scaleNotes: "C#3 / D3 D#3 E3 F3 F#3 G3 G#3 A3 A#3 B3 C4 C#4 D#4 E4 F#4 G#4 A4 B4 C#5",
    price: 159990,
    oldPrice: 239990,
    notesCount: 20,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/C-sharp_Kurd_20.m4a",
  },
  {
    slug: "c-sharp-low-pygmy-17",
    name: "Ханг C# Low Pygmy 17",
    scaleNotes: "C#2 / D2 D#2 E2 F2 F#2 G2 G#2 A2 A#2 B2 C#3 D#3 F3 G#3 A#3 C#4",
    price: 135990,
    oldPrice: 203990,
    notesCount: 17,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/C-sharp_Low_Pygmy_17.m4a",
  },
  {
    slug: "c-sharp-pygmy-11-6",
    name: "Ханг C# Pygmy 11+6",
    scaleNotes: "F1 F#1 G#1 F2 F#2 G#2 C#3 / D3 D#3 E3 F3 F#3 G#3 A3 F#4 G#4 A4",
    price: 135990,
    oldPrice: 203990,
    notesCount: 17,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/C-sharp_Pygmy_11+6.m4a",
  },
  {
    slug: "c-sharp-pygmy-12-7",
    name: "Ханг C# Pygmy 12+7",
    scaleNotes: "F1 F#1 G#1 F2 F#2 G#2 C3 C#3 / D3 D#3 E3 F3 F#3 G3 G#3 A3 F#4 G#4 A4",
    price: 151990,
    oldPrice: 227990,
    notesCount: 19,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/C-sharp_Pygmy_12+7.m4a",
  },
  {
    slug: "c-ashakiran-16",
    name: "Ханг C Ashakiran 16",
    scaleNotes: "C3 / C#3 D3 E3 F3 G3 A3 B3 C4 D4 E4 F4 G4 A4 B4 C5",
    price: 127990,
    oldPrice: 191990,
    notesCount: 16,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/C_Ashakiran_16.m4a",
  },
  {
    slug: "c-ashakiran-9-8",
    name: "Ханг C Ashakiran 9+8",
    scaleNotes: "A#1 C2 C#2 D#2 F2 G2 G#2 A#2 C3 / D3 E3 F3 G3 A3 B3 C4 D4",
    price: 135990,
    oldPrice: 203990,
    notesCount: 17,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/C_Ashakiran_9+8.m4a",
  },
  {
    slug: "d-hijaz-10",
    name: "Ханг D Hijaz 10",
    scaleNotes: "D3 / A3 A#3 C4 D4 D#4 F#4 G4 A4 A#4",
    price: 79990,
    oldPrice: 119990,
    notesCount: 10,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/D_Hijaz_10.m4a",
  },
  {
    slug: "d-kurd-10-3",
    name: "Ханг D Kurd 10+3",
    scaleNotes: "E2 F#2 G2 D3 / A3 A#3 C4 D4 E4 F4 G4 A4 A#4",
    price: 103990,
    oldPrice: 155990,
    notesCount: 13,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/D_Kurd_10+3.m4a",
  },
  {
    slug: "d-kurd-10",
    name: "Ханг D Kurd 10",
    scaleNotes: "D3 / A3 A#3 C4 D4 E4 F4 G4 A4 A#4",
    price: 79990,
    oldPrice: 119990,
    notesCount: 10,
    tuningHz: "440",
    stockQty: 2,
    audioSample: "/audio/D_Kurd_10.m4a",
  },
  {
    slug: "d-kurd-12-4",
    name: "Ханг D Kurd 12+4",
    scaleNotes: "D2 E2 F#2 G2 D3 / A3 A#3 C4 D4 E4 F4 G4 A4 A#4 C5 D5",
    price: 127990,
    oldPrice: 191990,
    notesCount: 16,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/D_Kurd_12+4.m4a",
  },
  {
    slug: "d-kurd-12-8",
    name: "Ханг D Kurd 12+8",
    scaleNotes: "G1 A1 B1 C2 D2 E2 F#2 G2 D3 / A3 A#3 C4 D4 E4 F4 G4 A4 A#4 C5 D5",
    price: 159990,
    oldPrice: 239990,
    notesCount: 20,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/D_Kurd_12+8.m4a",
  },
  {
    slug: "d-kurd-12",
    name: "Ханг D Kurd 12",
    scaleNotes: "D3 / A3 A#3 C4 D4 E4 F4 G4 A4 A#4 C5 D5",
    price: 95990,
    oldPrice: 143990,
    notesCount: 12,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/D_Kurd_12.m4a",
  },
  {
    // Отдельной записи строя на 11 нот нет — берём ближайшую (D Kurd 12) и обрезаем
    // на одну верхнюю ноту; аудио оставляем от 12-нотного, т.к. отдельной записи нет.
    slug: "d-kurd-11",
    name: "Ханг D Kurd 11",
    scaleNotes: "D3 / A3 A#3 C4 D4 E4 F4 G4 A4 A#4 C5",
    price: 87990,
    oldPrice: 131990,
    notesCount: 11,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/D_Kurd_12.m4a",
  },
  {
    slug: "d-kurd-17",
    name: "Ханг D Kurd 17",
    scaleNotes: "D3 / D#3 E3 F3 F#3 G3 A3 A#3 C4 D4 E4 F4 G4 A4 A#4 C5 D5",
    price: 135990,
    oldPrice: 203990,
    notesCount: 17,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/D_Kurd_17.m4a",
  },
  {
    slug: "e-amara-13-7",
    name: "Ханг E Amara 13+7",
    scaleNotes: "A1 B1 C#2 D2 E2 F#2 A2 E3 / F3 F#3 G3 B3 D4 E4 F#4 G4 A4 B4 D5 E5",
    price: 159990,
    oldPrice: 239990,
    notesCount: 20,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/E_Amara_13+7.m4a",
  },
  {
    slug: "e-amara-16",
    name: "Ханг E Amara 16",
    scaleNotes: "E3 / F3 F#3 G3 G#3 A3 A#3 B3 D4 E4 F#4 G4 A4 B4 D5 E5",
    price: 127990,
    oldPrice: 191990,
    notesCount: 16,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/E_Amara_16.m4a",
  },
  {
    slug: "e-amara-17",
    name: "Ханг E Amara 17",
    scaleNotes: "E3 / F3 F#3 G3 G#3 A3 A#3 B3 C4 D4 E4 F#4 G4 A4 B4 D5 E5",
    price: 135990,
    oldPrice: 203990,
    notesCount: 17,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/E_Amara_17.m4a",
  },
  {
    slug: "e-amara-19",
    name: "Ханг E Amara 19",
    scaleNotes: "E3 / F3 F#3 G3 G#3 A3 A#3 B3 C4 C#4 D4 D#4 E4 F#4 G4 A4 B4 D5 E5",
    price: 151990,
    oldPrice: 227990,
    notesCount: 19,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/E_Amara_19.m4a",
  },
  {
    slug: "e-equinox-12",
    name: "Ханг E Equinox 12",
    scaleNotes: "E3 / G3 B3 C4 D4 E4 F#4 G4 B4 C5 D5 E5",
    price: 95990,
    oldPrice: 143990,
    notesCount: 12,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/E_Equinox_12.m4a",
  },
  {
    slug: "e-kurd-19",
    name: "Ханг E Kurd 19",
    scaleNotes: "E3 / F3 F#3 G3 G#3 A3 A#3 B3 C4 C#4 D4 E4 F#4 G4 A4 B4 C5 D5 E5",
    price: 151990,
    oldPrice: 227990,
    notesCount: 19,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/E_Kurd_19.m4a",
  },
  {
    slug: "f-sharp-kurd-16-6",
    name: "Ханг F# Kurd 16+6",
    scaleNotes: "D#2 E2 F#2 G#2 A#2 B2 F#3 / G3 G#3 A3 A#3 C#4 D4 E4 F#4 G#4 A4 B4 C#5 D5 E5 F#5",
    price: 175990,
    oldPrice: 263990,
    notesCount: 22,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/F-sharp_Kurd_16+6.m4a",
  },
  {
    slug: "f-sharp-low-pygmy-17",
    name: "Ханг F# Low Pygmy 17",
    scaleNotes: "F#2 / G2 G#2 A2 A#2 B2 C3 C#3 D3 D#3 E3 F#3 G#3 A#3 C#4 D#4 F#4",
    price: 135990,
    oldPrice: 203990,
    notesCount: 17,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/F-sharp_Low_Pygmy_17.m4a",
  },
  {
    slug: "f-sharp-low-pygmy-21",
    name: "Ханг F# Low Pygmy 21",
    scaleNotes:
      "F#2 / G2 G#2 A2 A#2 B2 C3 C#3 D3 D#3 E3 F3 F#3 G3 G#3 A3 A#3 B3 C#4 D#4 F#4",
    price: 167990,
    oldPrice: 251990,
    notesCount: 21,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/F-sharp_Low_Pygmy_21.m4a",
  },
  {
    slug: "f-sharp-pygmy-11-6",
    name: "Ханг F# Pygmy 11+6",
    scaleNotes: "A#1 B1 C#2 A#2 B2 C#3 F#3 / G3 G#3 A3 A#3 B3 C#4 D4 B4 C#5 D5",
    price: 135990,
    oldPrice: 203990,
    notesCount: 17,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/F-sharp_Pygmy_11+6.m4a",
  },
  {
    slug: "f-sharp-pygmy-12-9",
    name: "Ханг F# Pygmy 12+9",
    scaleNotes: "A#1 B1 C#2 A#2 B2 C#3 D#3 E3 F3 F#3 / G3 G#3 A3 A#3 B3 C4 C#4 D4 B4 C#5 D5",
    price: 167990,
    oldPrice: 251990,
    notesCount: 21,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/F-sharp_Pygmy_12+9.m4a",
  },
  {
    slug: "f-sharp-romanian-hijaz-13",
    name: "Ханг F# Romanian Hijaz 13",
    scaleNotes: "F#3 / G3 G#3 A3 A#3 B3 C#4 D4 F4 B4 C#5 D5 F5",
    price: 103990,
    oldPrice: 155990,
    notesCount: 13,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/F-sharp_Romanian_Hijaz_13.m4a",
  },
  {
    slug: "f-kurd-9-6",
    name: "Ханг F Kurd 9+6",
    scaleNotes: "D2 D#2 F2 G2 A2 A#2 F3 / C4 C#4 D#4 F4 G4 G#4 A#4 C5",
    price: 119990,
    oldPrice: 179990,
    notesCount: 15,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/F_Kurd_9+6.m4a",
  },
  {
    slug: "f-low-pygmy-12",
    name: "Ханг F Low Pygmy 12",
    scaleNotes: "F2 / F#2 G2 G#2 A2 A#2 F3 G3 A3 C4 D4 F4",
    price: 95990,
    oldPrice: 143990,
    notesCount: 12,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/F_Low_Pygmy_12.m4a",
  },
  {
    slug: "f-low-pygmy-17",
    name: "Ханг F Low Pygmy 17",
    scaleNotes: "F2 / F#2 G2 G#2 A2 A#2 B2 C3 C#3 D3 D#3 F3 G3 A3 C4 D4 F4",
    price: 135990,
    oldPrice: 203990,
    notesCount: 17,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/F_Low_Pygmy_17.m4a",
  },
  {
    slug: "f-pygmy-17",
    name: "Ханг F Pygmy 17",
    scaleNotes: "F3 / F#3 G3 G#3 A3 A#3 B3 C4 C#4 D4 D#4 E4 F4 F#4 A#4 C5 C#5",
    price: 135990,
    oldPrice: 203990,
    notesCount: 17,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/F_Pygmy_17.m4a",
  },
];

/** Число нот в верхней деке — последний токен имени до "+" (нижние ноты не считаются). */
function getUpperNotes(name: string): number {
  const lastToken = name.trim().split(/\s+/).pop() ?? "";
  return Number(lastToken.split("+")[0]);
}

const PHOTOS = [
  { filename: "handpan-12.webp", alt: "Ханг, 12-нотная дека", upperNotes: 12 },
  { filename: "handpan-10.webp", alt: "Ханг, 10-нотная дека", upperNotes: 10 },
] as const;

/** Находит media по имени файла или загружает его из public/images/products. */
async function findOrUploadPhoto(payload: Payload, filename: string, alt: string) {
  const found = await payload.find({
    collection: "media",
    where: { filename: { equals: filename } },
    limit: 1,
  });
  if (found.docs[0]) return found.docs[0];

  return payload.create({
    collection: "media",
    data: { alt },
    filePath: path.resolve(process.cwd(), "public/images/products", filename),
  });
}

/**
 * Проставляет товарам фото, ничего не удаляя, — в отличие от runSeed, которая
 * пересоздаёт каталог целиком. На боевой базе нужен именно этот путь: удалить товар,
 * на который ссылается оформленный заказ, Postgres всё равно не даст
 * (orders_items.product_id NOT NULL), да и терять связь заказа с инструментом нельзя.
 *
 * Идемпотентна: media ищутся по имени файла, товары с непустым media[] пропускаются —
 * значит фото, выставленные вручную через админку, не перетираются.
 */
export async function attachProductPhotos(payload: Payload) {
  const [photo12, photo10] = await Promise.all(
    PHOTOS.map((p) => findOrUploadPhoto(payload, p.filename, p.alt)),
  );

  const all = await payload.find({ collection: "products", limit: 1000 });
  let updated = 0;

  for (const doc of all.docs) {
    if (Array.isArray(doc.media) && doc.media.length > 0) continue;

    const photo = getUpperNotes(doc.name) === 12 ? photo12 : photo10;
    await payload.update({
      collection: "products",
      id: doc.id,
      data: { media: [photo.id] },
    });
    updated++;
    console.log(`Фото проставлено: ${doc.slug}`);
  }

  console.log(`Готово. Обновлено товаров: ${updated} из ${all.docs.length}.`);
  return { updated, total: all.docs.length };
}

/**
 * Пересоздаёт media и products. Принимает уже готовый `payload`, а не вызывает
 * `getPayload` сама — так её можно позвать и из процесса Next.js dev-сервера
 * (см. app/(app)/api/dev-seed/route.ts), в обход `payload` CLI/`tsx payload/seed.ts`,
 * которые на Next.js 16 падают в payload/dist/bin/loadEnv.js (payloadcms/payload#16378).
 *
 * ⚠️ Только для пустой/локальной базы: на базе с заказами удаление товаров упадёт
 * на orders_items.product_id NOT NULL — там нужна attachProductPhotos.
 */
export async function runSeed(payload: Payload) {
  const oldProducts = await payload.find({ collection: "products", limit: 1000 });
  for (const doc of oldProducts.docs) {
    await payload.delete({ collection: "products", id: doc.id });
    console.log(`Удалено: ${doc.slug}`);
  }

  const oldMedia = await payload.find({ collection: "media", limit: 1000 });
  for (const doc of oldMedia.docs) {
    await payload.delete({ collection: "media", id: doc.id });
  }

  // У мастерской 2 формы верхней деки — 12-нотная и остальные (см. ProductCard).
  // Пока по одному фото на форму; позже здесь появится реальная съёмка по каждому товару
  // и поле video — тогда в media[] будет несколько кадров и подключится слайдер.
  const photo12 = await payload.create({
    collection: "media",
    data: { alt: "Ханг, 12-нотная дека" },
    filePath: path.resolve(process.cwd(), "public/images/products/handpan-12.webp"),
  });
  const photo10 = await payload.create({
    collection: "media",
    data: { alt: "Ханг, 10-нотная дека" },
    filePath: path.resolve(process.cwd(), "public/images/products/handpan-10.webp"),
  });

  for (const product of products) {
    const photo = getUpperNotes(product.name) === 12 ? photo12 : photo10;
    await payload.create({ collection: "products", data: { ...product, media: [photo.id] } });
    console.log(`Создано: ${product.slug}`);
  }
}

// Только при прямом запуске (`npm run payload:seed`) — при импорте runSeed из другого
// модуля (например, из временного dev-роута) сама себя не вызывает и process не завершает.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  getPayload({ config })
    .then(runSeed)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
