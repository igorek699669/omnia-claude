import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload, type Payload } from "payload";
import config from "./payload.config";

/**
 * Каталог хангов, собранный по реальным аудиозаписям строёв из public/audio/.
 * "+N" в названии — нижние ноты, notesCount = верхние + нижние.
 *
 * Формат scaleNotes: динг / звукоряд по возрастанию, нижние ноты — в скобках.
 * Октавы в каталогах производителей часто не проставлены — дописаны по возрастанию
 * от динга (динг без явной октавы — третья).
 *
 * Сверено по каталогам производителей:
 * - mrpans.com — C Ashakiran 9+8, C# Pygmy 11+6 и 12+7, D Kurd 10, 10+3, 12 и 12+4,
 *   E Amara 13+7 и 16 («E Amara 11+5»), E Equinox 12, F Pygmy 11+6 и 12,
 *   F# Pygmy 11+6 и 12+9, F# Romanian Hijaz 13;
 * - yishama.com/virtual-pantam — A Hijaz 14, D Hijaz 10, D Kurd 12+8 («D Kurd 20»);
 * - yataoshop.com (YataoPan/MAG/Mudra/Ayasa) — D Kurd 17 (13+4), C Ashakiran 16
 *   (достроен между их же 15 и 17), E Amara 17 (13+4) и 19 (13+6);
 * - C# Kurd 20 и E Kurd 19 — транспонированы с yishama D Kurd 20 и Mudra D Kurd 19
 *   (интервалы строя фиксированы, перенос по полутонам точен).
 *
 * Звукоряды проверены по самим записям: спектральный разбор онсетов
 * (scratchpad/notes.py + audit.py, ffmpeg + numpy) даёт список реально сыгранных нот.
 * На заведомо верных строях метод не выдал ни одной лишней ноты, так что расхождение
 * «услышано, но нет в строе» — сигнал ошибки. Именно так выяснилось, что "Low Pygmy" —
 * НЕ пигмей с дингом на октаву ниже: на второй октаве у этих записей энергии нет
 * (0.1–1.6 от уровня шума против 7–21 на третьей). То же пишет handpanshop.eu:
 * "F2 Pygmy ... the build-up is exactly the same as Low Pygmy, but then another bass
 * note is added ... So a Low Pygmy with an added bass". Поэтому у "X Low Pygmy" динг
 * в третьей октаве — и раскладка совпадает с "X Pygmy" того же размера у mrpans.
 *
 * Отсюда же — почему в каталоге больше нет позиций "Low Pygmy": четыре из них оказались
 * тем же строем, что и обычный "Pygmy" того же размера (C# Low Pygmy 17 = C# Pygmy 11+6,
 * F# Low Pygmy 17 = F# Pygmy 11+6, F# Low Pygmy 21 = F# Pygmy 12+9,
 * F Low Pygmy 17 = F Pygmy 11+6), и как дубли удалены — осталось по одной позиции с
 * названием, как у mrpans, и с более длинной из двух записей. Пятая, F Low Pygmy 12,
 * дубля не имела и просто переименована в F Pygmy 12. Записи удалённых дублей остались
 * в public/audio/ (C-sharp_Low_Pygmy_17, F-sharp_Low_Pygmy_17, F-sharp_Low_Pygmy_21,
 * F_Low_Pygmy_17) и больше нигде не используются.
 *
 * Двух строёв нет ни в одном каталоге — там раскладка достроена и помечена ⚠️ на месте:
 * F Kurd 9+6 (верхние 9 стандартны, нижние 6 достроены) и F# Kurd 16+6 (достроен целиком,
 * 16 верхних нот не делает ни один известный мастер — стоит уточнить у мастерской).
 *
 * Запуск: npm run payload:seed (старые товары при этом удаляются).
 */
const products = [
  {
    slug: "a-hijaz-14",
    name: "Ханг A Hijaz 14",
    scaleNotes: "A2 / (D3) E3 (F3) G3 A3 Bb3 C#4 D4 E4 (F4) G4 (A4) (D5)",
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
    scaleNotes: "C#3 / (D#3) (E3) (F#3) G#3 A3 B3 C#4 D#4 E4 F#4 G#4 B4 C#5 D#5 (E5) (F#5) (G#5) (A5) (B5)",
    price: 159990,
    oldPrice: 239990,
    notesCount: 20,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/C-sharp_Kurd_20.m4a",
  },
  {
    slug: "c-sharp-pygmy-11-6",
    name: "Ханг C# Pygmy 11+6",
    scaleNotes: "C#3 / (D3) (E3) F#3 G#3 A3 (B3) C#4 (D4) E4 F#4 G#4 A4 (B4) C#5 (D5) E5",
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
    scaleNotes: "C#3 / (D3) (E3) F#3 G#3 A3 (B3) C#4 (D4) E4 F#4 G#4 A4 (B4) C#5 (D5) E5 F#5 (G#5)",
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
    scaleNotes: "C3 / (D3) (E3) F3 G3 A3 B3 C4 D4 E4 (F4) G4 (A4) (B4) (C5) (D5)",
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
    scaleNotes: "C3 / (D3) (E3) F3 G3 A3 B3 C4 D4 E4 (F4) G4 (A4) (B4) (C5) (D5) (E5)",
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
    scaleNotes: "D3 / A3 C4 D4 Eb4 F#4 G4 A4 C5 D5",
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
    scaleNotes: "D3 / (F3) (G3) A3 Bb3 C4 D4 E4 F4 G4 A4 C5 (D5)",
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
    scaleNotes: "D3 / A3 Bb3 C4 D4 E4 F4 G4 A4 C5",
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
    scaleNotes: "(C3) D3 / (E3) (F3) (G3) A3 Bb3 C4 D4 E4 F4 G4 A4 C5 D5 E5",
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
    scaleNotes: "D3 / (E3) (F3) (G3) A3 Bb3 C4 D4 E4 F4 G4 A4 C5 D5 E5 (F5) (G5) (A5) (Bb5) (C6)",
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
    scaleNotes: "D3 / A3 Bb3 C4 D4 E4 F4 G4 A4 C5 D5 E5",
    price: 95990,
    oldPrice: 143990,
    notesCount: 12,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/D_Kurd_12.m4a",
  },
  {
    // Ни записи, ни строя на 11 нот у mrpans нет — берём сверенный D Kurd 12 и
    // обрезаем верхнюю ноту; аудио тоже от 12-нотного, отдельного нет.
    slug: "d-kurd-11",
    name: "Ханг D Kurd 11",
    scaleNotes: "D3 / A3 Bb3 C4 D4 E4 F4 G4 A4 C5 D5",
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
    scaleNotes: "(Bb2) (C3) D3 / (F3) (G3) A3 Bb3 C4 D4 E4 F4 G4 A4 C5 D5 E5 F5",
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
    scaleNotes: "(C3) (D3) E3 / (F#3) (G3) (A3) B3 (C4) D4 E4 F#4 G4 A4 B4 (C5) D5 E5 F#5 G5 A5",
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
    scaleNotes: "(C3) (D3) E3 / (F#3) (G3) (A3) B3 D4 E4 F#4 G4 A4 B4 D5 E5 F#5",
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
    scaleNotes: "(C3) (D3) E3 / (F#3) (G3) B3 D4 E4 F#4 G4 A4 B4 D5 E5 F#5 G5 A5",
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
    scaleNotes: "(C3) (D3) E3 / (F#3) (G3) (A3) B3 (C4) D4 E4 F#4 G4 A4 B4 D5 E5 F#5 G5 A5",
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
    scaleNotes: "E3 / G3 B3 C4 D4 E4 F#4 G4 B4 D5 E5 F#5",
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
    scaleNotes: "(C3) (D3) E3 / (G3) (A3) B3 C4 D4 E4 F#4 G4 A4 B4 D5 E5 F#5 (G5) (A5) (B5)",
    price: 151990,
    oldPrice: 227990,
    notesCount: 19,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/E_Kurd_19.m4a",
  },
  {
    // ⚠️ Единственный строй, которого нет ни в одном каталоге, — раскладка достроена.
    // Прежние ноты были невозможны (G3 и A#3 в фа-диез миноре не существуют). Динг F#3 и
    // нижние D3/E3 слышны в записи; верхние 16 — продолжение документированного ряда
    // D Kurd (mrpans D Kurd 13 + продолжение звукоряда), транспонированного на большую
    // терцию вверх. 16 верхних нот на деке не делает ни один известный мастер, так что
    // раскладку стоит подтвердить у мастерской — возможно, инструмент 16-нотный
    // (10 верхних + 6 нижних), и тогда notesCount и цену надо пересчитать.
    slug: "f-sharp-kurd-16-6",
    name: "Ханг F# Kurd 16+6",
    scaleNotes: "(D3) (E3) F#3 / (G#3) (A3) (B3) C#4 D4 E4 F#4 G#4 A4 B4 C#5 E5 F#5 G#5 A5 B5 C#6 D6 (E6)",
    price: 175990,
    oldPrice: 263990,
    notesCount: 22,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/F-sharp_Kurd_16+6.m4a",
  },
  {
    slug: "f-sharp-pygmy-11-6",
    name: "Ханг F# Pygmy 11+6",
    scaleNotes: "(D3) (E3) F#3 / G#3 A3 (B3) C#4 (D4) E4 F#4 G#4 A4 (B4) C#5 (D5) E5 F#5",
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
    scaleNotes: "(D3) (E3) F#3 / G#3 A3 (B3) C#4 (D4) E4 F#4 G#4 A4 (B4) C#5 (D5) E5 F#5 G#5 (A5) (B5) (C#6)",
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
    scaleNotes: "F#3 / B3 C#4 D4 F4 F#4 G#4 A4 B4 C#5 D5 F5 F#5",
    price: 103990,
    oldPrice: 155990,
    notesCount: 13,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/F-sharp_Romanian_Hijaz_13.m4a",
  },
  {
    // ⚠️ F Kurd в каталогах не нашёлся. Верхние 9 нот — стандартный Kurd от динга F3
    // (в записи слышны F3, Eb4, F4, Ab4, Bb4), нижние 6 достроены по раскладке
    // mrpans B2 Kurd 9+5 и ждут сверки с мастерской.
    slug: "f-kurd-9-6",
    name: "Ханг F Kurd 9+6",
    scaleNotes: "F3 / (Ab3) (Bb3) C4 Db4 Eb4 F4 G4 Ab4 Bb4 C5 (Db5) (Eb5) (F5) (G5)",
    price: 119990,
    oldPrice: 179990,
    notesCount: 15,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/F_Kurd_9+6.m4a",
  },
  {
    slug: "f-pygmy-12",
    name: "Ханг F Pygmy 12",
    scaleNotes: "F3 / G3 Ab3 C4 Eb4 F4 G4 Ab4 C5 Eb5 F5 G5",
    price: 95990,
    oldPrice: 143990,
    notesCount: 12,
    tuningHz: "440",
    stockQty: 0,
    audioSample: "/audio/F_Low_Pygmy_12.m4a",
  },
  {
    slug: "f-pygmy-11-6",
    name: "Ханг F Pygmy 11+6",
    scaleNotes: "(C3) (Db3) (Eb3) F3 / G3 Ab3 (Bb3) C4 (Db4) Eb4 F4 G4 Ab4 C5 Db5 Eb5 (F5)",
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
 * Слаги, которые менялись уже после того, как каталог уехал на прод. Без этой карты
 * синхронизация увидела бы «пропал старый товар, появился новый», удалила бы документ
 * и создала другой — с новым id, оборвав ссылки из заказов и подписок на наличие.
 */
const RENAMED_SLUGS: Record<string, string> = {
  // Дубли «Low Pygmy» убраны, уцелевшие переименованы по каталогу mrpans (см. шапку файла).
  "f-pygmy-17": "f-pygmy-11-6",
  "f-low-pygmy-12": "f-pygmy-12",
};

/**
 * Поля, которые синхронизация переносит из этого файла в базу.
 *
 * stockQty и media сюда сознательно не входят: остаток — живые данные (списывается при
 * оплате и правится в админке), а фото могли быть заменены вручную. Перетирать их
 * значениями из сида нельзя. Фото новым товарам проставляются отдельно, при создании.
 */
const SYNCED_FIELDS = [
  "name",
  "scaleNotes",
  "price",
  "oldPrice",
  "notesCount",
  "tuningHz",
  "audioSample",
] as const;

/**
 * Приводит каталог в базе к тому, что описано в этом файле, ничего лишнего не ломая, —
 * рабочий режим для прода, в отличие от runSeed, которая сносит products и media целиком.
 *
 * Что делает: переименовывает слаги по RENAMED_SLUGS, обновляет поля из SYNCED_FIELDS
 * у совпавших по слагу товаров, создаёт недостающие (сразу с фото) и убирает те, которых
 * в файле больше нет. Удаляет только когда на товар никто не ссылается: если он есть в
 * заказе или в подписке на наличие, документ остаётся, но ему выставляется stockQty 0 —
 * из каталога он пропадёт, а история заказа не порвётся.
 *
 * Идемпотентна: второй запуск подряд не меняет ничего.
 */
export async function syncProducts(payload: Payload) {
  const existing = await payload.find({ collection: "products", limit: 1000 });
  const bySlug = new Map(existing.docs.map((doc) => [doc.slug, doc]));

  for (const [from, to] of Object.entries(RENAMED_SLUGS)) {
    const doc = bySlug.get(from);
    if (!doc || bySlug.has(to)) continue;
    await payload.update({ collection: "products", id: doc.id, data: { slug: to } });
    bySlug.delete(from);
    bySlug.set(to, { ...doc, slug: to });
    console.log(`Переименован слаг: ${from} -> ${to}`);
  }

  const [photo12, photo10] = await Promise.all(
    PHOTOS.map((p) => findOrUploadPhoto(payload, p.filename, p.alt)),
  );

  let created = 0;
  let updated = 0;

  for (const product of products) {
    const doc = bySlug.get(product.slug);

    if (!doc) {
      const photo = getUpperNotes(product.name) === 12 ? photo12 : photo10;
      await payload.create({ collection: "products", data: { ...product, media: [photo.id] } });
      created++;
      console.log(`Создан: ${product.slug}`);
      continue;
    }

    bySlug.delete(product.slug);

    const patch: Record<string, unknown> = {};
    for (const field of SYNCED_FIELDS) {
      if (product[field] !== doc[field]) patch[field] = product[field];
    }
    if (Object.keys(patch).length === 0) continue;

    await payload.update({ collection: "products", id: doc.id, data: patch });
    updated++;
    console.log(`Обновлён: ${product.slug} (${Object.keys(patch).join(", ")})`);
  }

  const deleted: string[] = [];
  const hidden: string[] = [];

  for (const doc of bySlug.values()) {
    const [inOrders, inSubs] = await Promise.all([
      payload.find({
        collection: "orders",
        where: { "items.product": { equals: doc.id } },
        limit: 1,
      }),
      payload.find({
        collection: "stock-subscriptions",
        where: { product: { equals: doc.id } },
        limit: 1,
      }),
    ]);

    if (inOrders.totalDocs > 0 || inSubs.totalDocs > 0) {
      if (doc.stockQty !== 0) {
        await payload.update({ collection: "products", id: doc.id, data: { stockQty: 0 } });
      }
      hidden.push(doc.slug);
      console.log(`Оставлен (есть ссылки), остаток обнулён: ${doc.slug}`);
      continue;
    }

    await payload.delete({ collection: "products", id: doc.id });
    deleted.push(doc.slug);
    console.log(`Удалён: ${doc.slug}`);
  }

  const result = { created, updated, deleted, hidden, total: products.length };
  console.log(
    `Синхронизация завершена: создано ${created}, обновлено ${updated}, ` +
      `удалено ${deleted.length}, скрыто ${hidden.length}. В файле товаров: ${products.length}.`,
  );
  return result;
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
