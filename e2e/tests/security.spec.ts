import { test, expect, Storefront, uniquePhone, uniqueIp } from "../fixtures";
import type { Page } from "@playwright/test";

/**
 * Попытки заплатить меньше, забрать чужое или получить чужую сессию.
 *
 * Всё, что приходит из браузера, подменяемо — поэтому сценарии здесь не «нажали не ту
 * кнопку», а настоящая правка тела запроса на лету: Server Action получает ровно тот
 * изменённый запрос, который прислал бы злоумышленник.
 */

const MOSCOW_PVZ = "Москва, ул. Тверская, 12";

/** Правит тело Server Action на пути к серверу — не трогая ни страницу, ни приложение. */
async function tamperServerAction(page: Page, patch: (body: string) => string): Promise<void> {
  await page.route(/\/(checkout|auth)$/, async (route) => {
    const request = route.request();
    if (request.method() !== "POST") return route.fallback();
    const body = request.postData();
    if (!body) return route.fallback();
    await route.continue({ postData: patch(body) });
  });
}

const customer = (phone: string) => ({
  lastName: "Иванов",
  firstName: "Пётр",
  email: "buyer@omnia.test",
  phone,
});

test.describe("защита денег и данных", () => {
  test("подменённая стоимость доставки не даёт оформить заказ", async ({
    page,
    seed,
    shop,
    storefront,
    phone,
  }) => {
    const product = seed.products.find((p) => p.slug === "e2e-kurd-10")!;
    const ordersBefore = (await shop.orders()).length;

    await storefront.addToCart(product.slug);
    await storefront.goToCheckout();
    await storefront.fillCustomer(customer(phone));
    await storefront.confirmPhone(phone);
    await storefront.choosePvz("Москва", MOSCOW_PVZ);
    await storefront.acceptConsents();

    // Доставка за рубль вместо посчитанной: без пересчёта на сервере счёт от СДЭК
    // пришёл бы мастерской.
    await tamperServerAction(page, (body) => body.replace(/"cost":\s*\d+/, '"cost":1'));
    await page.getByRole("button", { name: "Оформить заказ" }).click();

    await expect(page.getByText(/Стоимость доставки изменилась/)).toBeVisible();
    expect((await shop.orders()).length).toBe(ordersBefore);
  });

  test("пункт выдачи из другого города отклоняется", async ({ page, seed, shop, storefront, phone }) => {
    const product = seed.products.find((p) => p.slug === "e2e-kurd-10")!;
    const ordersBefore = (await shop.orders()).length;

    await storefront.addToCart(product.slug);
    await storefront.goToCheckout();
    await storefront.fillCustomer(customer(phone));
    await storefront.confirmPhone(phone);
    await storefront.choosePvz("Москва", MOSCOW_PVZ);
    await storefront.acceptConsents();

    // Город остаётся московским (по нему считалась цена), а забрать хотят во Владивостоке.
    await tamperServerAction(page, (body) => body.replace('"MSK1"', '"VVO1"'));
    await page.getByRole("button", { name: "Оформить заказ" }).click();

    await expect(page.getByText(/Пункт выдачи не совпадает с городом/)).toBeVisible();
    expect((await shop.orders()).length).toBe(ordersBefore);
  });

  test("количество сверх остатка не продаётся", async ({ page, seed, shop, storefront, phone }) => {
    const product = seed.products.find((p) => p.slug === "e2e-kurd-10")!;
    const ordersBefore = (await shop.orders()).length;

    await storefront.addToCart(product.slug);
    await storefront.goToCheckout();
    await storefront.fillCustomer(customer(phone));
    await storefront.confirmPhone(phone);
    await storefront.choosePvz("Москва", MOSCOW_PVZ);
    await storefront.acceptConsents();

    await tamperServerAction(page, (body) => body.replace(/"qty":\s*1/, '"qty":99'));
    await page.getByRole("button", { name: "Оформить заказ" }).click();

    await expect(page.getByText(/больше недоступен в нужном количестве/)).toBeVisible();
    expect((await shop.orders()).length).toBe(ordersBefore);
  });

  test("единственный инструмент не продаётся двум покупателям сразу", async ({
    browser,
    seed,
    shop,
    mocks,
    storefront,
    phone,
  }) => {
    // Ханги штучные: пока первый покупатель на странице оплаты, его инструмент занят —
    // иначе второму пришлось бы возвращать деньги.
    const product = seed.products.find((p) => p.slug === "e2e-pygmy-9")!;
    expect(product.stockQty).toBe(1);

    await storefront.addToCart(product.slug);
    await storefront.goToCheckout();
    await storefront.fillCustomer(customer(phone));
    await storefront.confirmPhone(phone);
    await storefront.choosePvz("Москва", MOSCOW_PVZ);
    await storefront.acceptConsents();
    await storefront.submitOrder();

    const first = await shop.lastOrder();
    expect(first.status).toBe("pending");

    // Второй покупатель — отдельный браузер, своя корзина и свой телефон.
    // Второй покупатель приходит со своего адреса — иначе он для лимита тот же человек.
    const context = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": uniqueIp() } });
    try {
      const second = new Storefront(await context.newPage(), mocks);
      const secondPhone = uniquePhone();

      await second.addToCart(product.slug);
      await second.goToCheckout();
      await second.fillCustomer(customer(secondPhone));
      await second.confirmPhone(secondPhone);
      await second.choosePvz("Москва", MOSCOW_PVZ);
      await second.acceptConsents();
      await second.page.getByRole("button", { name: "Оформить заказ" }).click();

      await expect(second.page.getByText(/больше недоступен в нужном количестве/)).toBeVisible();
      // Второго заказа не появилось — последний в базе всё ещё первый.
      expect((await shop.lastOrder()).id).toBe(first.id);
    } finally {
      await context.close();
    }
  });

  test("сумма платежа обязана совпадать с заказом", async ({ seed, shop, mocks, storefront, phone }) => {
    const product = seed.products.find((p) => p.slug === "e2e-kurd-10")!;

    await storefront.addToCart(product.slug);
    await storefront.goToCheckout();
    await storefront.fillCustomer(customer(phone));
    await storefront.confirmPhone(phone);
    await storefront.choosePvz("Москва", MOSCOW_PVZ);
    await storefront.acceptConsents();
    await storefront.submitOrder();

    const order = await shop.lastOrder();
    // Расхождение суммы платежа и заказа — сигнал, что одно из двух подменили. Заказ в
    // таком виде проводить нельзя, даже если касса говорит «оплачено».
    await shop.setOrderTotal(order.id, order.total + 5000);

    const result = await mocks.pay(order.paymentId!);
    expect((result.webhook as { status: number }).status).toBe(400);

    expect((await shop.order(order.id)).status).toBe("pending");
    expect((await shop.product(product.slug)).stockQty).toBe(product.stockQty);
    expect(await mocks.shipments()).toHaveLength(0);
  });

  test("вебхук не верит телу запроса и проверяет платёж у кассы", async ({ request }) => {
    // Тело вебхука ЮKassa не подписано — поверить ему на слово значит выдать любой заказ
    // оплаченным по одному POST снаружи.
    const forged = await request.post("/api/webhooks/yookassa", {
      data: { event: "payment.succeeded", object: { id: "pay-не-существует" } },
    });
    expect(forged.status()).toBe(502);

    const malformed = await request.post("/api/webhooks/yookassa", {
      headers: { "Content-Type": "application/json" },
      data: "не json",
    });
    expect(malformed.status()).toBe(400);

    const empty = await request.post("/api/webhooks/yookassa", { data: { event: "payment.succeeded" } });
    expect(empty.status()).toBe(400);
  });

  test("подделанный билет подтверждения номера не даёт войти", async ({ page, mocks, phone }) => {
    await page.goto("/auth");

    // Билет связывает номер с проверкой SMS.ru подписью: иначе злоумышленник дозванивается
    // со своего номера и подставляет чужой. Портим подпись — вход обязан сорваться.
    await tamperServerAction(page, (body) =>
      body.replace(/\.([A-Za-z0-9_-]{20,})/g, (_, signature: string) => `.${[...signature].reverse().join("")}`),
    );

    await page.getByPlaceholder("Телефон").pressSequentially(phone.replace("+7", ""), { delay: 20 });
    await page.getByRole("button", { name: "Продолжить" }).click();
    await expect(page.getByRole("heading", { name: "Позвоните нам" })).toBeVisible();

    await mocks.confirmCall(phone);

    await expect(page.getByText(/Время на звонок вышло/)).toBeVisible({ timeout: 30_000 });

    // Сессии нет: кабинет по-прежнему требует входа.
    await page.unroute(/\/(checkout|auth)$/);
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/auth/);
  });
});
