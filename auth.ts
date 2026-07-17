import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  // Без таймаутов зависший SMTP (фаервол/антивирус блокирует исходящий трафик) вешает запрос навечно.
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 10_000,
});

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: { enabled: false },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 300,
      async sendVerificationOTP({ email, otp }) {
        await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: email,
          subject: "Код подтверждения Omnia",
          text: `Ваш код подтверждения: ${otp}\n\nОн действует 5 минут.`,
          html: `<p>Ваш код подтверждения:</p><p style="font-size:28px;font-weight:600;letter-spacing:0.2em">${otp}</p><p>Он действует 5 минут.</p>`,
        });
      },
    }),
    // Должен быть последним плагином — прокидывает сессионные cookie через Next.js Server Actions.
    nextCookies(),
  ],
});
