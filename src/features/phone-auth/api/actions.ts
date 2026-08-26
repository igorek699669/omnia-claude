"use server";

import { headers } from "next/headers";
import { auth, takeGeneratedOtp } from "@/auth";
import { clientIp } from "@/shared/lib";
import { startCallCheck, getCallCheckStatus, CHECK_CONFIRMED } from "./sms-ru";
import { createTicket, readTicket } from "./ticket";
import { takePhoneCallAttempt } from "./rate-limit";

const PHONE_RE = /^\+7\d{10}$/;

export interface StartResult {
  callPhone?: string;
  callPhonePretty?: string;
  /** Подписанная связка «номер + проверка», её надо вернуть в confirmPhoneByCall. */
  ticket?: string;
  error?: string;
}

export interface ConfirmResult {
  /** true — покупатель дозвонился, номер подтверждён и сессия уже выдана. */
  confirmed?: boolean;
  error?: string;
}

/**
 * Заводит проверку номера и отдаёт телефон, на который покупатель должен позвонить.
 * Номер приходит уже нормализованным в E.164 (normalizePhone на клиенте).
 */
export async function startPhoneCall(phone: string): Promise<StartResult> {
  if (!PHONE_RE.test(phone)) return { error: "Некорректный номер телефона" };

  // Лимит до обращения к SMS.ru: проверка там платная, и отказать нужно раньше, чем
  // она заведётся (см. rate-limit.ts).
  const verdict = takePhoneCallAttempt(phone, clientIp(await headers()));
  if (!verdict.allowed) {
    const minutes = Math.max(1, Math.ceil((verdict.retryAfterMs ?? 0) / 60_000));
    return { error: `Слишком много попыток. Попробуйте через ${minutes} мин.` };
  }

  try {
    const { checkId, callPhone, callPhonePretty } = await startCallCheck(phone);
    return { callPhone, callPhonePretty, ticket: createTicket(phone, checkId) };
  } catch (error) {
    console.error("[phone-auth] не удалось начать проверку номера:", error);
    return { error: "Не получилось подготовить звонок — попробуйте ещё раз" };
  }
}

/**
 * Спрашивает SMS.ru, дозвонился ли покупатель. Если да — заводит пользователя (при первом
 * входе) и выдаёт сессию силами Better Auth.
 *
 * Клиент дёргает это раз в несколько секунд, пока не придёт confirmed или не выйдет время.
 */
export async function confirmPhoneByCall(ticket: string): Promise<ConfirmResult> {
  const payload = readTicket(ticket);
  if (!payload) return { error: "Время на звонок вышло — начните заново" };

  let status: number;
  try {
    status = await getCallCheckStatus(payload.checkId);
  } catch (error) {
    console.error("[phone-auth] не удалось получить статус проверки:", error);
    return { error: "Не получилось проверить звонок — попробуйте ещё раз" };
  }
  if (status !== CHECK_CONFIRMED) return { confirmed: false };

  // Номер подтверждён звонком. Дальше — штатный путь Better Auth: он сам заведёт
  // пользователя по signUpOnVerification, пометит номер подтверждённым и поставит cookie.
  // Код нигде не показывается — сервер генерирует его и тут же проверяет сам,
  // подробности в комментарии к takeGeneratedOtp в auth.ts.
  const requestHeaders = await headers();
  try {
    await auth.api.sendPhoneNumberOTP({ body: { phoneNumber: payload.phone } });
    const code = takeGeneratedOtp(payload.phone);
    if (!code) throw new Error("Better Auth не передал код в sendOTP");

    await auth.api.verifyPhoneNumber({
      body: { phoneNumber: payload.phone, code },
      headers: requestHeaders,
    });
  } catch (error) {
    console.error("[phone-auth] звонок подтверждён, но войти не удалось:", error);
    return { error: "Номер подтверждён, но войти не получилось — попробуйте ещё раз" };
  }

  return { confirmed: true };
}
