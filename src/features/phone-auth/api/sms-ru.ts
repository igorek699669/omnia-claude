import "server-only";

/**
 * Подтверждение номера входящим звонком (SMS.ru «callcheck», https://sms.ru/api/call).
 *
 * Не SMS: без регистрации буквенного отправителя операторы молча отклоняют доставку (статус
 * 107, деньги возвращаются). Не flash call: операторы режут его как спам с 2023 года, и
 * SMS.ru пометил свой code/call устаревшим. Остаётся обратный сценарий — номер называем мы,
 * звонит покупатель: для него это бесплатно (8-800), SMS.ru звонок сбрасывает.
 */
// Переопределяется только в E2E: настоящая проверка платная и требует живого звонка.
const SMS_RU_BASE = process.env.SMS_RU_API_URL ?? "https://sms.ru";
const TIMEOUT_MS = 10_000;

/** Номер подтверждён — покупатель дозвонился с него на выданный номер. */
export const CHECK_CONFIRMED = 401;
/** Звонка ещё не было. Ждём: у покупателя 5 минут. */
export const CHECK_PENDING = 400;

interface AddResponse {
  status?: string;
  status_code?: number;
  status_text?: string;
  check_id?: string;
  call_phone?: string;
  call_phone_pretty?: string;
}

interface StatusResponse {
  status?: string;
  status_code?: number;
  status_text?: string;
  check_status?: number;
  check_status_text?: string;
}

function apiId(): string {
  const id = process.env.SMS_RU_API_ID;
  if (!id) throw new Error("SMS_RU_API_ID не задан — подтвердить номер звонком нельзя");
  return id;
}

async function request<T>(path: string, params: Record<string, string>): Promise<T> {
  const body = new URLSearchParams({ ...params, api_id: apiId(), json: "1" });
  const response = await fetch(`${SMS_RU_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    // Без таймаута зависший провайдер держал бы запрос на вход навечно.
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  return (await response.json()) as T;
}

/** Регистрирует проверку и возвращает телефон, на который звонить. У покупателя 5 минут. */
export async function startCallCheck(phone: string) {
  // SMS.ru ждёт номер цифрами, без «+» и разметки.
  const result = await request<AddResponse>("/callcheck/add", { phone: phone.replace(/\D/g, "") });

  // SMS.ru отвечает 200 даже на отказ — реальный результат только в теле.
  if (result.status !== "OK" || !result.check_id || !result.call_phone) {
    const reason = result.status_text ?? `код ${result.status_code}`;
    console.error(`[callcheck] SMS.ru не принял проверку номера ${phone}: ${reason}`);
    throw new Error(`SMS.ru: ${reason}`);
  }

  return {
    checkId: result.check_id,
    callPhone: result.call_phone,
    // Красивый вид приходит от SMS.ru («8-800-777-9999») — свой формат не выдумываем.
    callPhonePretty: result.call_phone_pretty ?? result.call_phone,
  };
}

/** Опрашивает состояние проверки. CHECK_CONFIRMED — покупатель дозвонился. */
export async function getCallCheckStatus(checkId: string): Promise<number> {
  const result = await request<StatusResponse>("/callcheck/status", { check_id: checkId });

  if (result.status !== "OK" || typeof result.check_status !== "number") {
    const reason = result.status_text ?? `код ${result.status_code}`;
    console.error(`[callcheck] SMS.ru не отдал статус проверки ${checkId}: ${reason}`);
    throw new Error(`SMS.ru: ${reason}`);
  }
  return result.check_status;
}
