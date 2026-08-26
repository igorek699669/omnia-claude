import { defineConfig, devices } from "@playwright/test";

const APP_PORT = Number(process.env.E2E_APP_PORT ?? 3100);
const READY_PORT = Number(process.env.E2E_READY_PORT ?? 3101);
const MOCKS_PORT = Number(process.env.MOCKS_PORT ?? 4010);

export default defineConfig({
  testDir: "./e2e/tests",
  // Тесты делят одну базу и одну заглушку внешних сервисов: остаток товара, заказы и
  // письма — общее состояние. Параллельный прогон делал бы их взаимно непредсказуемыми,
  // а «не продать один инструмент дважды» без общего остатка вообще не проверить.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  timeout: 90_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: `http://127.0.0.1:${APP_PORT}`,
    locale: "ru-RU",
    timezoneId: "Europe/Moscow",
    trace: "on-first-retry",
    video: process.env.CI ? "retain-on-failure" : "off",
    screenshot: "only-on-failure",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: [
    {
      // Заглушки поднимаем первыми: приложение обращается к ним уже на первом чекауте.
      command: "node e2e/mocks/server.mjs",
      url: `http://127.0.0.1:${MOCKS_PORT}/__control/health`,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      command: "node e2e/scripts/serve.mjs",
      // Ждём не сам сайт, а признак готовности: он поднимается только после того, как
      // база пересоздана, схема накатана и каталог засеян (см. e2e/scripts/serve.mjs).
      url: `http://127.0.0.1:${READY_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
});
