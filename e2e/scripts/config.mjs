/**
 * Единственный источник настроек E2E: порты, окружение приложения и содержимое каталога.
 * Отсюда же читают тесты (через порт готовности), чтобы цены и остатки не разъезжались
 * между сидом и ожиданиями.
 */

export const APP_PORT = Number(process.env.E2E_APP_PORT ?? 3100);
export const READY_PORT = Number(process.env.E2E_READY_PORT ?? 3101);
export const MOCKS_PORT = Number(process.env.MOCKS_PORT ?? 4010);
export const MOCKS_SMTP_PORT = Number(process.env.MOCKS_SMTP_PORT ?? 4025);

export const APP_URL = `http://127.0.0.1:${APP_PORT}`;
export const MOCKS_URL = `http://127.0.0.1:${MOCKS_PORT}`;

/** Адрес, на который приложение шлёт уведомления продавцу об оплаченных заказах. */
export const SELLER_EMAIL = "seller@omnia.test";

export const ADMIN = { email: "admin@omnia.test", password: "e2e-admin-password" };

/**
 * Окружение приложения на время прогона.
 *
 * Задаётся здесь целиком и явно — переменные из .env.local не перебьют его: Next не
 * переопределяет то, что уже есть в process.env. Пустые строки тоже значимы (SMTP_USER,
 * ключ Яндекс.Карт) — они гасят локальные значения, из-за которых прогон полез бы наружу.
 */
export const E2E_ENV = {
  DATABASE_URL: process.env.E2E_DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:5433/omnia_e2e",
  PAYLOAD_SECRET: "e2e-payload-secret",
  BETTER_AUTH_SECRET: "e2e-better-auth-secret-value",
  BETTER_AUTH_URL: APP_URL,

  // Внешние сервисы смотрят в заглушку (e2e/mocks/server.mjs), а не наружу.
  SMS_RU_API_URL: `${MOCKS_URL}/sms`,
  SMS_RU_API_ID: "e2e-sms-ru",
  YOOKASSA_API_URL: `${MOCKS_URL}/yookassa/v3`,
  YOOKASSA_SHOP_ID: "e2e-shop",
  YOOKASSA_SECRET_KEY: "e2e-secret",
  CDEK_API_URL: `${MOCKS_URL}/cdek/v2`,
  CDEK_ACCOUNT: "e2e-account",
  CDEK_SECURE_PASSWORD: "e2e-password",
  CDEK_SHIPMENT_POINT: "",

  SMTP_HOST: "127.0.0.1",
  SMTP_PORT: String(MOCKS_SMTP_PORT),
  SMTP_SECURE: "false",
  // Пусто — иначе nodemailer полезет авторизовываться, а приёмник в заглушке AUTH не умеет.
  SMTP_USER: "",
  SMTP_PASSWORD: "",
  SMTP_FROM: "Omnia <no-reply@omnia.test>",
  ORDER_NOTIFY_EMAIL: SELLER_EMAIL,

  // Без ключа карта ПВЗ рисует заглушку вместо загрузки скрипта Яндекса — в пайплайне
  // внешние скрипты не грузим, а выбор пункта выдачи и так делается через поле поиска.
  NEXT_PUBLIC_YANDEX_MAPS_API_KEY: "",

  // Свой каталог сборки: иначе Next отказывается поднимать второй dev-сервер рядом с
  // рабочим («Another next dev server is already running») — лок лежит внутри distDir.
  NEXT_DIST_DIR: ".next-e2e",
};

/**
 * Каталог прогона. Остатки подобраны под сценарии: у «Kurd 10» есть запас, «Pygmy 9»
 * существует в единственном экземпляре (проверка, что его не продадут дважды),
 * «Amara 17» распродан (проверка витрины и подписки на наличие).
 */
export const PRODUCTS = [
  {
    slug: "e2e-kurd-10",
    name: "Ханг E2E Kurd 10",
    scaleNotes: "D3 / A3 Bb3 C4 D4 E4 F4 G4 A4 C5",
    price: 100000,
    oldPrice: 130000,
    notesCount: 10,
    tuningHz: "440",
    stockQty: 3,
    audioSample: "/audio/D_Kurd_10.m4a",
  },
  {
    slug: "e2e-pygmy-9",
    name: "Ханг E2E Pygmy 9",
    scaleNotes: "F3 / Ab3 Bb3 C4 Eb4 F4 Ab4 Bb4 C5",
    price: 90000,
    notesCount: 9,
    tuningHz: "440",
    stockQty: 1,
  },
  {
    slug: "e2e-amara-17",
    name: "Ханг E2E Amara 17",
    scaleNotes: "E3 / B3 C#4 D4 E4 F#4 G#4 A4 B4 C#5 D5 E5",
    price: 150000,
    oldPrice: 200000,
    notesCount: 17,
    tuningHz: "432",
    stockQty: 0,
  },
];
