/**
 * Телефон живёт в двух видах: маска «+7 (900) 000-00-00» в полях ввода и E.164 во всём, что
 * уходит наружу — Better Auth, SMS.ru, СДЭК. Единственный конвертер между ними.
 */
export function normalizePhone(masked: string): string {
  const digits = masked.replace(/\D/g, "");
  // «8 900…» — привычный россиянам ввод, приводим к +7.
  const national = digits.startsWith("8") ? digits.slice(1) : digits.replace(/^7/, "");
  return `+7${national}`;
}

export function isValidRuPhone(masked: string): boolean {
  return /^\+7\d{10}$/.test(normalizePhone(masked));
}

/** Обратно из E.164 в читаемый вид — для приветствия в шапке и подписей. */
export function formatPhone(e164: string): string {
  const m = /^\+7(\d{3})(\d{3})(\d{2})(\d{2})$/.exec(e164);
  return m ? `+7 (${m[1]}) ${m[2]}-${m[3]}-${m[4]}` : e164;
}
