import type { Product } from "./types";

/**
 * Названия инструментов приходят из Payload в международной записи — «Ханг F# Kurd 16+6».
 * Покупатель ищет по-русски: «ханг ре курд», «ханг фа-диез пигми». Здесь разбор имени
 * на части и его русское написание, чтобы заголовок страницы и разметка говорили обоими
 * словарями. Английское название при этом никуда не девается — оно и есть модель.
 */

/**
 * Строй → его русское написание. Именно написание, а не перевод: Kurd, Pygmy, Hijaz —
 * имена собственные, и «ре минор» вместо «ре курд» было бы просто другим строем.
 * Единственное исключение — Romanian: это обычное прилагательное, и по-русски оно
 * всюду пишется «румынский», а не транслитерацией.
 * Ключ в нижнем регистре, «romanian hijaz» — двусловный.
 */
const SCALES: Record<string, string> = {
  kurd: "курд",
  pygmy: "пигми",
  hijaz: "хиджаз",
  "romanian hijaz": "румынский хиджаз",
  amara: "амара",
  equinox: "эквинокс",
  ashakiran: "ашакиран",
};

/** Нота динга → русское название. B и H — одна и та же нота в разных традициях записи. */
const NOTES: Record<string, string> = {
  A: "ля",
  "A#": "ля-диез",
  B: "си",
  H: "си",
  C: "до",
  "C#": "до-диез",
  D: "ре",
  "D#": "ре-диез",
  E: "ми",
  F: "фа",
  "F#": "фа-диез",
  G: "соль",
  "G#": "соль-диез",
};

/** «21 нота» · «22 ноты» · «10 нот» — в живых описаниях было «22 нот». */
export function notesWord(count: number): string {
  const tens = count % 100;
  const ones = count % 10;
  if (ones === 1 && tens !== 11) return "нота";
  if (ones >= 2 && ones <= 4 && (tens < 12 || tens > 14)) return "ноты";
  return "нот";
}

/**
 * «Ханг D Kurd 11» → модель «D Kurd 11» и строй по-русски «ре курд». Имя нестандартного
 * вида разбору не поддаётся — тогда модель это всё имя без слова «Ханг», а русского
 * написания строя нет и его просто не пишем.
 */
export function parseProductName(name: string): { model: string; scaleRu?: string } {
  const model = name.replace(/^Ханг\s+/i, "");

  const match = /^([A-H]#?)\s+(.+?)\s+\d+(?:\+\d+)?$/.exec(model);
  if (!match) return { model };

  const noteRu = NOTES[match[1].toUpperCase()];
  const scaleRu = SCALES[match[2].toLowerCase()];
  if (!noteRu || !scaleRu) return { model };

  return { model, scaleRu: `${noteRu} ${scaleRu}` };
}

/**
 * Крупный заголовок страницы товара: модель, число нот и строй по-русски.
 * Одно только имя («Ханг D Kurd 11») не отвечает ни на один вопрос покупателя.
 */
export function productHeading(product: Product): string {
  const { model, scaleRu } = parseProductName(product.name);
  const notes = `${product.notesCount} ${notesWord(product.notesCount)}`;
  return scaleRu ? `Ханг ${model} — ${notes}, строй ${scaleRu}` : `Ханг ${model} — ${notes}`;
}
