import { test, expect, waitForAppReady } from "../fixtures";

/**
 * Корзина. Она живёт в localStorage, поэтому важны две вещи: суммы считаются правильно и
 * содержимое переживает перезагрузку — иначе покупатель теряет выбранный инструмент по
 * дороге к оплате.
 */

const rub = (value: number) => new RegExp(String(value).replace(/\B(?=(\d{3})+(?!\d))/g, "\\s?"));

test.describe("корзина", () => {
  test("товар добавляется из каталога и виден в счётчике шапки", async ({ page, seed }) => {
    const product = seed.products.find((p) => p.stockQty > 0)!;

    await page.goto("/catalog");
    await waitForAppReady(page);
    await page.getByRole("button", { name: `Добавить «${product.name}» в корзину` }).click();

    await expect(page.getByRole("link", { name: "Корзина, товаров: 1" })).toBeVisible();
  });

  test("суммы и скидка считаются по цене из каталога", async ({ page, seed, storefront }) => {
    const product = seed.products.find((p) => p.stockQty > 0 && p.oldPrice)!;
    await storefront.addToCart(product.slug);

    await page.goto("/cart");
    await waitForAppReady(page);
    await expect(page.getByRole("link", { name: product.name })).toBeVisible();
    await expect(page.getByText("Итого").locator("..")).toContainText(rub(product.price));

    // Две штуки — сумма удваивается, и это же число уходит в заказ.
    await page.getByRole("button", { name: "+", exact: true }).click();
    await expect(page.getByText("Товары, шт.").locator("..")).toContainText("2");
    await expect(page.getByText("Итого").locator("..")).toContainText(rub(product.price * 2));

    // Скидка — разница со старой ценой, а не выдуманный процент.
    await expect(page.getByText("Скидка").locator("..")).toContainText(
      rub((product.oldPrice! - product.price) * 2),
    );
  });

  test("корзина переживает перезагрузку страницы", async ({ page, seed, storefront }) => {
    const product = seed.products.find((p) => p.stockQty > 0)!;
    await storefront.addToCart(product.slug);

    await page.goto("/cart");
    await page.reload();
    await waitForAppReady(page);

    await expect(page.getByRole("link", { name: product.name })).toBeVisible();
  });

  test("товар удаляется, корзина пустеет", async ({ page, seed, storefront }) => {
    const product = seed.products.find((p) => p.stockQty > 0)!;
    await storefront.addToCart(product.slug);

    await page.goto("/cart");
    await waitForAppReady(page);
    await page.getByRole("button", { name: `Убрать «${product.name}» из корзины` }).click();

    await expect(page.getByText("В корзине пока пусто.")).toBeVisible();
  });

  test("из корзины можно перейти к оформлению", async ({ seed, storefront, page }) => {
    const product = seed.products.find((p) => p.stockQty > 0)!;
    await storefront.addToCart(product.slug);
    await storefront.goToCheckout();

    // На чекауте должен оказаться именно выбранный товар, а не весь каталог.
    await expect(page.getByText(product.name)).toBeVisible();
  });
});
