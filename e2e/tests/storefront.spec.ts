import { test, expect, waitForAppReady } from "../fixtures";

/**
 * Витрина. Проверяется то, без чего магазина нет вовсе: страницы открываются, товар из
 * Payload доезжает до каталога и карточки, а распроданный инструмент нельзя купить.
 */

test.describe("витрина", () => {
  test("главная открывается и ведёт в каталог", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Omnia/i);
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();

    // Через бургер-меню: это единственная навигация, общая для всех брейкпоинтов.
    await waitForAppReady(page);
    await page.getByRole("button", { name: "Меню" }).click();
    await page.getByRole("link", { name: "Каталог", exact: true }).click();
    await expect(page).toHaveURL(/\/catalog/);
    await expect(page.getByRole("heading", { name: "Все инструменты" })).toBeVisible();
  });

  test("каталог показывает засеянные товары с ценами", async ({ page, seed }) => {
    await page.goto("/catalog");
    await waitForAppReady(page);

    for (const product of seed.products) {
      const card = page.getByRole("link", { name: product.name });
      await expect(card.first()).toBeVisible();
    }

    // Цена именно из Payload, а не из вёрстки: формат ₽ через formatPrice.
    const inStock = seed.products.find((p) => p.stockQty > 0)!;
    await expect(page.getByText(new RegExp(inStock.price.toLocaleString("ru-RU").replace(/\s/g, "\\s")))).toBeVisible();
  });

  test("страница товара показывает данные из каталога", async ({ page, seed }) => {
    const product = seed.products.find((p) => p.stockQty > 0)!;
    await page.goto(`/product/${product.slug}`);
    await waitForAppReady(page);

    await expect(page.getByRole("heading", { name: product.name })).toBeVisible();
    await expect(page.getByText(product.scaleNotes)).toBeVisible();
    await expect(page.getByRole("button", { name: "Добавить в корзину" })).toBeVisible();
  });

  test("распроданный инструмент купить нельзя — предлагается подписка на наличие", async ({ page, seed }) => {
    const soldOut = seed.products.find((p) => p.stockQty === 0)!;
    await page.goto(`/product/${soldOut.slug}`);
    await waitForAppReady(page);

    await expect(page.getByRole("heading", { name: soldOut.name })).toBeVisible();
    await expect(page.getByRole("button", { name: "Добавить в корзину" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /наличи/i })).toBeVisible();
  });

  test("несуществующий товар показывает «нет такого», а не пустую страницу", async ({ page }) => {
    await page.goto("/product/no-such-handpan");

    // Код ответа здесь не проверяем: страница стримится, шапка уходит в браузер раньше,
    // чем notFound() успевает сработать, и статус остаётся 200. Для покупателя важно,
    // что он видит внятный экран со ссылкой в каталог, а не пустоту.
    await expect(page.getByRole("heading", { name: "Такого инструмента нет" })).toBeVisible();
    await expect(page.getByRole("link", { name: "В каталог" })).toBeVisible();
  });
});
