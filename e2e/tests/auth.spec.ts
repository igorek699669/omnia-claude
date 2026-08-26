import { test, expect } from "../fixtures";

/**
 * Вход по телефону. Кода покупатель нигде не вводит: он звонит на номер SMS.ru, а сессию
 * выдаёт Better Auth — значит проверять надо не «показали окно», а что после звонка
 * появилась настоящая сессия и личный кабинет открывается.
 */

test.describe("вход по звонку", () => {
  test("звонок подтверждает номер и открывает личный кабинет", async ({ page, mocks, phone }) => {
    await page.goto("/auth");

    await page.getByPlaceholder("Телефон").pressSequentially(phone.replace("+7", ""), { delay: 20 });
    await page.getByRole("button", { name: "Продолжить" }).click();

    // Номер для звонка выдаёт SMS.ru — приложение не придумывает его само.
    await expect(page.getByRole("heading", { name: "Позвоните нам" })).toBeVisible();
    await expect(page.getByRole("link", { name: "8-800-777-9999" })).toBeVisible();

    await mocks.confirmCall(phone);

    await expect(page).toHaveURL(/\/profile/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Мои заказы" })).toBeVisible();
  });

  test("сессия переживает перезагрузку и выход завершает её", async ({ page, mocks, phone }) => {
    await page.goto("/auth");
    await page.getByPlaceholder("Телефон").pressSequentially(phone.replace("+7", ""), { delay: 20 });
    await page.getByRole("button", { name: "Продолжить" }).click();
    // Ждём окно со звонком: проверка в SMS.ru должна успеть завестись, иначе
    // подтверждать ещё нечего.
    await expect(page.getByRole("heading", { name: "Позвоните нам" })).toBeVisible();
    await mocks.confirmCall(phone);
    await expect(page).toHaveURL(/\/profile/, { timeout: 30_000 });

    await page.reload();
    await expect(page.getByRole("heading", { name: "Мои заказы" })).toBeVisible();

    await page.getByRole("button", { name: "Аккаунт" }).click();
    await page.getByRole("button", { name: "Выйти" }).click();
    await expect(page.getByText("Вы вышли")).toBeVisible();

    // После выхода кабинет больше не наш — приложение уводит на вход.
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/auth/, { timeout: 30_000 });
  });

  test("перебор попыток по одному номеру отбивается лимитом", async ({ page, phone }) => {
    // Каждая попытка — платная проверка в SMS.ru, поэтому их не больше трёх на номер за
    // 15 минут (src/features/phone-auth/api/rate-limit.ts). Без лимита баланс сливается
    // скриптом за минуты, а вместе с ним ложится вход и подтверждение телефона на чекауте.
    await page.goto("/auth");

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      await page.getByPlaceholder("Телефон").pressSequentially(phone.replace("+7", ""), { delay: 10 });
      await page.getByRole("button", { name: "Продолжить" }).click();
      await expect(page.getByRole("heading", { name: "Позвоните нам" })).toBeVisible();
      await page.getByRole("button", { name: "Изменить номер" }).click();
    }

    await page.getByPlaceholder("Телефон").pressSequentially(phone.replace("+7", ""), { delay: 10 });
    await page.getByRole("button", { name: "Продолжить" }).click();

    await expect(page.getByText(/Слишком много попыток/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Позвоните нам" })).toHaveCount(0);
  });

  test("отказ SMS.ru показывает ошибку, а не ломает страницу", async ({ page, mocks, phone }) => {
    await mocks.fail("sms-ru");

    await page.goto("/auth");
    await page.getByPlaceholder("Телефон").pressSequentially(phone.replace("+7", ""), { delay: 20 });
    await page.getByRole("button", { name: "Продолжить" }).click();

    await expect(page.getByText(/Не получилось подготовить звонок/)).toBeVisible();
    // Форма осталась на месте — покупатель может попробовать ещё раз.
    await expect(page.getByRole("button", { name: "Продолжить" })).toBeVisible();
  });
});
