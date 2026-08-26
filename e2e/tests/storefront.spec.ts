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

  test("карточка товара отдаёт метаданные и разметку для поиска", async ({ page, seed }) => {
    const product = seed.products.find((p) => p.stockQty > 0)!;
    await page.goto(`/product/${product.slug}`);

    // Заголовок собирается по шаблону из корневого layout.
    await expect(page).toHaveTitle(`${product.name} — Omnia`);

    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute("href", new RegExp(`/product/${product.slug}$`));

    // Превью ссылки: без absolute-адреса соцсети картинку не подхватят.
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /^https?:\/\//);

    // Разметка Product — то, из чего выдача берёт цену и наличие.
    const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
    const jsonLd = JSON.parse(raw!);
    expect(jsonLd["@type"]).toBe("Product");
    expect(jsonLd.name).toBe(product.name);
    expect(jsonLd.offers.price).toBe(product.price);
    expect(jsonLd.offers.priceCurrency).toBe("RUB");
    expect(jsonLd.offers.availability).toBe("https://schema.org/InStock");
    expect(jsonLd.offers.url).toMatch(new RegExp(`/product/${product.slug}$`));
  });

  test("распроданный инструмент помечен в разметке как отсутствующий", async ({ page, seed }) => {
    const soldOut = seed.products.find((p) => p.stockQty === 0)!;
    await page.goto(`/product/${soldOut.slug}`);

    const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(JSON.parse(raw!).offers.availability).toBe("https://schema.org/OutOfStock");
  });

  test("карта сайта перечисляет товары и не выдаёт личные страницы", async ({ page, seed }) => {
    const response = await page.goto("/sitemap.xml");
    expect(response!.status()).toBe(200);

    const xml = await response!.text();
    for (const product of seed.products) {
      expect(xml, `в карте сайта должен быть ${product.slug}`).toContain(`/product/${product.slug}`);
    }
    expect(xml).toContain("/catalog");
    // Корзина, чекаут, кабинет и вход — личные страницы, им в выдаче делать нечего.
    for (const path of ["/cart", "/checkout", "/profile", "/auth"]) {
      expect(xml, `${path} не должен попадать в карту сайта`).not.toContain(`${path}<`);
    }
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
