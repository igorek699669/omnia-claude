/**
 * Поднимает приложение для E2E: чистая база → схема → админ → каталог → готовность.
 *
 * Почему `next dev`, а не `next build && next start`: схема Payload синхронизируется через
 * drizzle push, а он работает только при NODE_ENV !== "production" (тот же трюк, что и в
 * docker/migrate.sh — там прод-контейнер тоже поднимается после разового `next dev`).
 * Собранная сборка проверяется отдельным шагом пайплайна (`npm run build`).
 *
 * Готовность объявляется не тем, что сервер ответил, а отдельным портом, который
 * открывается только после сида: иначе Playwright начал бы тесты на пустом каталоге.
 */
import { spawn } from "node:child_process";
import http from "node:http";
import { Client } from "pg";
import { E2E_ENV, APP_PORT, READY_PORT, APP_URL, ADMIN, PRODUCTS } from "./config.mjs";

const children = [];

function run(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });
  children.push(child);
  return child;
}

async function waitFor(check, { timeoutMs = 180_000, everyMs = 1000, what }) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      if (await check()) return;
    } catch (err) {
      lastError = err;
    }
    await new Promise((resolve) => setTimeout(resolve, everyMs));
  }
  throw new Error(`Не дождались: ${what}. Последняя ошибка: ${lastError ?? "нет"}`);
}

/**
 * База пересоздаётся каждый прогон: тесты пишут заказы, списывают остатки и заводят
 * пользователей, и «почти чистая» база быстро перестаёт быть предсказуемой.
 */
async function resetDatabase() {
  const url = new URL(E2E_ENV.DATABASE_URL);
  const dbName = url.pathname.slice(1);
  const admin = new URL(url);
  admin.pathname = "/postgres";

  const client = new Client({ connectionString: admin.toString() });
  await client.connect();
  try {
    // WITH (FORCE) отцепляет висящие соединения от прошлого прогона (Postgres 13+).
    await client.query(`DROP DATABASE IF EXISTS ${JSON.stringify(dbName)} WITH (FORCE)`);
    await client.query(`CREATE DATABASE ${JSON.stringify(dbName)}`);
  } finally {
    await client.end();
  }
  console.log(`[e2e] база ${dbName} пересоздана`);
}

/** Таблицы Better Auth (user/session/account) — их CLI, в отличие от payload, работает. */
async function migrateAuth() {
  await new Promise((resolve, reject) => {
    const child = run("npx", ["better-auth", "migrate", "-y"], { env: { ...process.env, ...E2E_ENV } });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`better-auth migrate → ${code}`))));
    child.on("error", reject);
  });
  console.log("[e2e] таблицы Better Auth созданы");
}

function startApp() {
  const app = run("npx", ["next", "dev", "--port", String(APP_PORT), "--hostname", "127.0.0.1"], {
    env: { ...process.env, ...E2E_ENV, PAYLOAD_CONFIG_PATH: "payload/payload.config.ts" },
  });
  app.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[e2e] next dev завершился с кодом ${code}`);
      process.exit(code);
    }
  });
  return app;
}

/** 200 на коллекции Payload означает, что drizzle push уже создал схему. */
async function waitForSchema() {
  await waitFor(
    async () => {
      const res = await fetch(`${APP_URL}/api/products?limit=1`);
      return res.status === 200;
    },
    { what: "схема Payload (drizzle push)" },
  );
  console.log("[e2e] схема Payload готова");
}

/**
 * Товары заводятся через настоящий REST Payload под настоящим админом — тем же путём,
 * которым каталог наполняет владелец. Через SQL было бы быстрее, но мимо хуков коллекции
 * (тот же inStock считается в beforeChange).
 */
async function seedCatalog() {
  const registration = await fetch(`${APP_URL}/api/users/first-register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ADMIN),
  });
  if (!registration.ok) {
    throw new Error(`Не удалось завести админа: ${registration.status} ${await registration.text()}`);
  }
  const { token } = await registration.json();

  const created = [];
  for (const product of PRODUCTS) {
    const res = await fetch(`${APP_URL}/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `JWT ${token}` },
      body: JSON.stringify(product),
    });
    if (!res.ok) throw new Error(`Не удалось создать товар ${product.slug}: ${res.status} ${await res.text()}`);
    const { doc } = await res.json();
    created.push({ id: String(doc.id), ...product });
  }
  console.log(`[e2e] каталог наполнен: ${created.length} товара`);
  return created;
}

/**
 * Прогрев роутов до того, как Playwright начнёт тесты.
 *
 * В dev-режиме Next компилирует страницу при первом обращении, и на /checkout это больше
 * десяти секунд. Без прогрева цену платит первый же тест, который туда зайдёт, — а ожидания
 * в тестах рассчитаны на 15 секунд, так что он падал через раз. Флак доставался разным
 * тестам в зависимости от порядка запуска и выглядел как поломка их логики.
 *
 * Ошибки глушим: прогрев — оптимизация, а не проверка. Если страница не открылась, об этом
 * куда внятнее скажет сам тест.
 */
async function warmUpRoutes() {
  const routes = ["/", "/catalog", "/cart", "/checkout", "/auth", "/profile"];
  for (const route of routes) {
    try {
      const res = await fetch(`${APP_URL}${route}`);
      await res.text();
    } catch {
      // не открылось — не беда, тест скажет об этом яснее
    }
  }
  console.log(`[e2e] роуты прогреты: ${routes.length}`);
}

/**
 * Порт готовности. Playwright ждёт именно его, а тесты забирают отсюда состав каталога,
 * чтобы не хардкодить id и цены в двух местах.
 */
function announceReady(products) {
  const payload = JSON.stringify({ ready: true, appUrl: APP_URL, admin: ADMIN, products });
  http
    .createServer((req, res) => {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(payload);
    })
    .listen(READY_PORT, "127.0.0.1", () => console.log(`[e2e] готово, признак на порту ${READY_PORT}`));
}

function shutdown() {
  for (const child of children) {
    try {
      child.kill();
    } catch {
      // процесс уже мёртв — ничего страшного
    }
  }
  process.exit(0);
}

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, shutdown);

try {
  await resetDatabase();
  await migrateAuth();
  startApp();
  await waitForSchema();
  const products = await seedCatalog();
  await warmUpRoutes();
  announceReady(products);
} catch (err) {
  console.error("[e2e] подготовка не удалась:", err);
  shutdown();
  process.exit(1);
}
