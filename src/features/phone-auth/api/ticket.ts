import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Подписанный «билет» проверки: номер + check_id SMS.ru + срок годности. Без подписи
 * злоумышленник заводит проверку на свой номер, дозванивается и присылает свой check_id с
 * чужим номером — и получает сессию на чужой аккаунт. Подпись делает связку неразрывной, не
 * заводя серверного состояния: билет переживает перезапуск и не мешает нескольким инстансам.
 */
const TTL_MS = 5 * 60 * 1000; // столько же, сколько SMS.ru ждёт звонка

interface TicketPayload {
  phone: string;
  checkId: string;
  /** Unix-время в миллисекундах, после которого билет недействителен. */
  exp: number;
}

function secret(): string {
  const value = process.env.BETTER_AUTH_SECRET;
  if (!value) throw new Error("BETTER_AUTH_SECRET не задан — нечем подписать билет проверки");
  return value;
}

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

export function createTicket(phone: string, checkId: string, now = Date.now()): string {
  const payload: TicketPayload = { phone, checkId, exp: now + TTL_MS };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

/** Возвращает содержимое билета или null, если подпись не сходится либо срок вышел. */
export function readTicket(ticket: string, now = Date.now()): TicketPayload | null {
  const [data, signature] = ticket.split(".");
  if (!data || !signature) return null;

  const expected = sign(data);
  // Сравнение постоянного времени: иначе по задержке можно подбирать подпись побайтово.
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as TicketPayload;
    if (typeof payload.exp !== "number" || payload.exp < now) return null;
    if (typeof payload.phone !== "string" || typeof payload.checkId !== "string") return null;
    return payload;
  } catch {
    return null;
  }
}
