import nodemailer from "nodemailer";

/**
 * Отдельный транспорт от auth.ts — тот держит свой (для OTP) и не экспортирует его наружу,
 * а payload/ не импортирует из src/, так что общий src/shared/lib для рассылки не подходит.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 10_000,
});

export async function sendRestockEmail(params: { to: string; productName: string; productSlug: string }) {
  const siteUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const link = `${siteUrl}/product/${params.productSlug}`;
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: params.to,
    subject: `«${params.productName}» снова в наличии — Omnia`,
    text: `Инструмент «${params.productName}» снова в наличии.\n\n${link}`,
    html: `<p>Инструмент «${params.productName}» снова в наличии.</p><p><a href="${link}">Перейти к инструменту →</a></p>`,
  });
}
