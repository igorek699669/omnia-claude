import { betterAuth } from "better-auth";
import { phoneNumber } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";

/**
 * Одноразовые коды, которые плагин сгенерировал в текущем запросе.
 *
 * Номер подтверждается не кодом из SMS, а входящим звонком покупателя на номер SMS.ru
 * (см. src/features/phone-auth) — код пользователь не видит и никуда не вводит. Но выдать
 * сессию и завести пользователя всё равно должен Better Auth: только у него есть
 * signUpOnVerification и установка cookie. Поэтому сервер сам проходит штатный путь
 * "отправить код -> проверить код", а эта карта переносит код между двумя вызовами.
 *
 * Карта в памяти безопасна: оба вызова происходят внутри одного server action, в одном
 * процессе, а sendOTP ждётся синхронно (фоновые задачи Better Auth не подключены).
 * Ключ — номер, так что параллельные входы разных людей друг друга не задевают.
 */
const pendingOtp = new Map<string, string>();

/** Забирает код, сгенерированный последним вызовом sendPhoneNumberOTP для этого номера. */
export function takeGeneratedOtp(phone: string): string | undefined {
  const code = pendingOtp.get(phone);
  pendingOtp.delete(phone);
  return code;
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
      // Ничего не отправляем: подтверждение приходит звонком покупателя, а не сообщением.
      // Задача колбэка — отдать сгенерированный код серверу, который его тут же и проверит.
      async sendOTP({ phoneNumber: phone, code }) {
        pendingOtp.set(phone, code);
      },
      // Вход и регистрация — одно действие: первое успешное подтверждение заводит пользователя.
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
