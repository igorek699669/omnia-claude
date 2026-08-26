import "server-only";

/**
 * Лимит на запуск проверки номера.
 *
 * Каждый вызов startPhoneCall заводит платную проверку в SMS.ru (/callcheck/add), а сам
 * server action открыт всему интернету. Без ограничения это кран, через который сливается
 * баланс: скрипт в цикле выносит его за минуты, и вместе с балансом ложится вход на /auth
 * и подтверждение телефона на чекауте — то есть все продажи.
 *
 * Счётчик держим в памяти процесса, а не в Postgres, сознательно. Приложение крутится
 * одним контейнером (docker-compose.prod.yml), так что делить состояние не с кем, а новая
 * таблица означала бы изменение схемы Payload — которое сейчас накатывается через drizzle
 * push и без бэкапов (см. пункты 08 и 19 плана запуска). Плата за это — счётчики
 * обнуляются при перезапуске: перезапуск редок и атакующему неподконтролен, а всплеск,
 * ради которого лимит и заводится, ловится в пределах одного процесса.
 */

/** По номеру: человеку хватает пары попыток — не дозвонился, набрал ещё раз. */
const PER_PHONE = { limit: 3, windowMs: 15 * 60 * 1000 };

/**
 * По адресу: страхует от перебора чужих номеров с одной машины. Порог выше номерного —
 * за одним адресом может сидеть офис или мобильный оператор с NAT.
 */
const PER_IP = { limit: 10, windowMs: 60 * 60 * 1000 };

const LONGEST_WINDOW_MS = Math.max(PER_PHONE.windowMs, PER_IP.windowMs);

/** Ключ -> отметки времени последних попыток; старее окна не хранятся. */
const attempts = new Map<string, number[]>();

let lastSweepAt = 0;

/** Иначе карта растёт на каждый новый номер и адрес и не отдаёт память обратно. */
function sweep(now: number): void {
  if (now - lastSweepAt < LONGEST_WINDOW_MS) return;
  lastSweepAt = now;
  for (const [key, times] of attempts) {
    if (times.every((time) => now - time >= LONGEST_WINDOW_MS)) attempts.delete(key);
  }
}

function fresh(key: string, windowMs: number, now: number): number[] {
  return (attempts.get(key) ?? []).filter((time) => now - time < windowMs);
}

export interface RateLimitVerdict {
  allowed: boolean;
  /** Сколько ждать до следующей попытки. Есть только когда allowed === false. */
  retryAfterMs?: number;
}

/**
 * Проверяет оба лимита и, если оба пройдены, засчитывает попытку.
 *
 * Проверка и запись разнесены намеренно: если номерной лимит пройден, а адресный нет,
 * попытка не должна списываться ни с того, ни с другого — иначе достаточно упереться
 * в лимит по IP, чтобы заодно исчерпать чужой номер.
 *
 * ip === null (локальная разработка без прокси) — ограничиваем только по номеру.
 */
export function takePhoneCallAttempt(phone: string, ip: string | null, now = Date.now()): RateLimitVerdict {
  sweep(now);

  const phoneKey = `phone:${phone}`;
  const phoneTimes = fresh(phoneKey, PER_PHONE.windowMs, now);
  const ipKey = ip ? `ip:${ip}` : null;
  const ipTimes = ipKey ? fresh(ipKey, PER_IP.windowMs, now) : [];

  if (phoneTimes.length >= PER_PHONE.limit) {
    attempts.set(phoneKey, phoneTimes);
    return { allowed: false, retryAfterMs: PER_PHONE.windowMs - (now - phoneTimes[0]) };
  }
  if (ipKey && ipTimes.length >= PER_IP.limit) {
    attempts.set(ipKey, ipTimes);
    return { allowed: false, retryAfterMs: PER_IP.windowMs - (now - ipTimes[0]) };
  }

  attempts.set(phoneKey, [...phoneTimes, now]);
  if (ipKey) attempts.set(ipKey, [...ipTimes, now]);
  return { allowed: true };
}
