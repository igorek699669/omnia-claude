import { betterAuth } from "better-auth";
import { phoneNumber } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";

/**
 * Отправка SMS через SMS.ru (https://sms.ru/api/send).
 *
 * Провайдер один и вызывается из одного места, поэтому живёт прямо здесь, а не в
 * отдельном слайсе: auth.ts — бэкенд, вне FSD (как и payload/).
 *
 * Без SMS_RU_API_ID отправка не делается, а код пишется в консоль сервера — так вход
 * работает локально и на стенде, пока нет договора с провайдером. В проде переменная
 * обязана быть заполнена, иначе коды утекут только в логи и никто не войдёт.
 */
async function sendSms(phone: string, text: string): Promise<void> {
  const apiId = process.env.SMS_RU_API_ID;
  if (!apiId) {
    console.warn(`[sms] SMS_RU_API_ID не задан — код для ${phone}: ${text}`);
    return;
  }

  const params = new URLSearchParams({
    api_id: apiId,
    // SMS.ru ждёт номер цифрами, без «+» и разметки.
    to: phone.replace(/\D/g, ""),
    msg: text,
    json: "1",
  });
  // Имя отправителя согласовывается в кабинете SMS.ru; пока не согласовано — не шлём поле.
  if (process.env.SMS_RU_FROM) params.set("from", process.env.SMS_RU_FROM);
  // test=1 — бесплатная имитация отправки на стороне SMS.ru (SMS не уходит, ответ как у реальной).
  if (process.env.SMS_RU_TEST === "true") params.set("test", "1");

  const response = await fetch("https://sms.ru/sms/send", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
    // Без таймаута зависший провайдер держал бы запрос на вход навечно.
    signal: AbortSignal.timeout(10_000),
  });

  // SMS.ru отвечает 200 даже на отказ — реальный результат только в теле.
  const result = (await response.json()) as {
    status?: string;
    status_code?: number;
    status_text?: string;
    sms?: Record<string, { status?: string; status_text?: string }>;
  };
  const delivery = Object.values(result.sms ?? {})[0];
  const reason =
    result.status !== "OK"
      ? (result.status_text ?? `код ${result.status_code}`)
      : delivery && delivery.status !== "OK"
        ? (delivery.status_text ?? "номер отклонён")
        : null;

  if (reason) {
    // Наружу Better Auth отдаёт голый 500 без тела — без этой строки причина отказа
    // (нет буквенного отправителя, кончился баланс, номер в стоп-листе) видна только тут.
    console.error(`[sms] SMS.ru отказал в отправке на ${phone}: ${reason}`);
    throw new Error(`SMS.ru: ${reason}`);
  }
}

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: { enabled: false },
  plugins: [
    phoneNumber({
      otpLength: 6,
      expiresIn: 300,
      // Российский мобильный в E.164: клиент нормализует маску перед отправкой (normalizePhone).
      phoneNumberValidator: (value) => /^\+7\d{10}$/.test(value),
      async sendOTP({ phoneNumber: phone, code }) {
        await sendSms(phone, `Код подтверждения Omnia: ${code}. Действует 5 минут.`);
      },
      // Вход и регистрация — одно действие: первый успешный код заводит пользователя.
      // Better Auth требует email в таблице users, поэтому подставляем технический адрес —
      // он служебный и нигде не показывается. Реальная почта покупателя живёт в заказе.
      signUpOnVerification: {
        getTempEmail: (phone) => `${phone.replace(/\D/g, "")}@phone.omnia.local`,
        getTempName: (phone) => phone,
      },
    }),
    // Должен быть последним плагином — прокидывает сессионные cookie через Next.js Server Actions.
    nextCookies(),
  ],
});
