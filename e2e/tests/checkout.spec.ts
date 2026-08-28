import { test, expect, waitForAppReady } from "../fixtures";
import { expectedTariff, expectedDeliveryCost } from "../mocks/cdek-fixtures.mjs";

/**
 * Оформление заказа — место, где сходятся деньги, персональные данные и доставка.
 *
 * Главное здесь не «форма отправилась», а что в базу лёг заказ, собранный сервером:
 * цена товара из каталога, доставка пересчитана в СДЭК, тариф сохранён тот самый, а
 * согласия покупателя записаны отдельной строкой (ФЗ №152-ФЗ).
 */

const MOSCOW = 44;
const MOSCOW_PVZ = "Москва, ул. Тверская, 12";

const customer = (phone: string) => ({
  lastName: "Иванов",
  firstName: "Пётр",
  email: "buyer@omnia.test",
  phone,
});

test.describe("оформление заказа", () => {
  test("заказ в пункт выдачи собирается сервером и уходит в кассу", async ({
    page,
    seed,
    shop,
    mocks,
    storefront,
    phone,
  }) => {
    const product = seed.products.find((p) => p.slug === "e2e-kurd-10")!;
    const tariff = expectedTariff(MOSCOW, "pvz", 1);
    // Доставка = тариф + страховка объявленной стоимости: инструмент дорогой, и страховой
    // сбор СДЭК платит покупатель, а не мастерская.
    const deliveryCost = expectedDeliveryCost(MOSCOW, "pvz", 1, product.price);

    await storefront.addToCart(product.slug);
    await storefront.goToCheckout();
    await storefront.fillCustomer(customer(phone));
    await storefront.confirmPhone(phone);
    await storefront.choosePvz("Москва", MOSCOW_PVZ);
    await storefront.acceptConsents();
    await storefront.submitOrder();

    // Касса получила ровно ту сумму, которую посчитал сервер.
    const total = product.price + deliveryCost;
    await expect(page.getByTestId("payment-amount")).toHaveText(`${total.toFixed(2)} RUB`);

    const order = await shop.lastOrder();
    expect(order.status).toBe("pending");
    expect(order.total).toBe(total);
    expect(order.customerEmail).toBe("buyer@omnia.test");
    // Приложение складывает имя как «Имя Фамилия» — именно так оно уедет в СДЭК.
    expect(order.customerName).toBe("Пётр Иванов");

    // Цена товара берётся из Payload, а не из корзины в localStorage.
    expect(order.items).toHaveLength(1);
    expect(order.items[0].qty).toBe(1);
    expect(order.items[0].price).toBe(product.price);

    // Доставка — своя, серверная: и сумма, и тариф, по которому потом поедет отправление.
    expect(order.delivery.provider).toBe("cdek");
    expect(order.delivery.type).toBe("pvz");
    expect(order.delivery.pvzCode).toBe("MSK1");
    expect(order.delivery.cityCode).toBe(MOSCOW);
    expect(order.delivery.cost).toBe(deliveryCost);
    expect(order.delivery.tariffCode).toBe(tariff.tariff_code);

    // Платёж создан с id заказа в метаданных — по нему вебхук найдёт заказ обратно.
    expect(order.paymentId).toBeTruthy();
    const [payment] = await mocks.payments();
    expect(payment.metadata?.orderId).toBe(String(order.id));
    expect(payment.amount.value).toBe(total.toFixed(2));
  });

  test("согласия покупателя записываются отдельной строкой", async ({
    seed,
    shop,
    storefront,
    phone,
  }) => {
    const product = seed.products.find((p) => p.slug === "e2e-kurd-10")!;

    await storefront.addToCart(product.slug);
    await storefront.goToCheckout();
    await storefront.fillCustomer(customer(phone));
    await storefront.confirmPhone(phone);
    await storefront.choosePvz("Москва", MOSCOW_PVZ);
    await storefront.acceptConsents({ marketing: true });
    await storefront.submitOrder();

    const order = await shop.lastOrder();
    const [consent] = await shop.consents();

    expect(consent.orderId).toBe(String(order.id));
    expect(consent.personalData).toBe(true);
    expect(consent.offer).toBe(true);
    // Рекламная рассылка необязательна — здесь отмечена, и это должно быть видно в логе.
    expect(consent.marketing).toBe(true);
    expect(consent.textVersion).toBeTruthy();
    expect(consent.userAgent).toContain("Mozilla");
  });

  test("курьерская доставка считается на каждый инструмент отдельным местом", async ({
    seed,
    shop,
    mocks,
    storefront,
    page,
    phone,
  }) => {
    const product = seed.products.find((p) => p.slug === "e2e-kurd-10")!;
    const tariff = expectedTariff(MOSCOW, "courier", 2);
    const deliveryCost = expectedDeliveryCost(MOSCOW, "courier", 2, product.price * 2);

    await storefront.addToCart(product.slug);

    // Второй такой же инструмент — каждый едет в своём коробе.
    await page.goto("/cart");
    await waitForAppReady(page);
    await page.getByRole("button", { name: "+", exact: true }).click();
    await expect(page.getByText("Товары, шт.").locator("..")).toContainText("2");

    await storefront.goToCheckout();
    await storefront.fillCustomer(customer(phone));
    await storefront.confirmPhone(phone);
    await storefront.chooseCourier("Москва", "ул. Ленина, 5");
    await storefront.acceptConsents();
    await storefront.submitOrder();

    const order = await shop.lastOrder();
    expect(order.items[0].qty).toBe(2);
    expect(order.total).toBe(product.price * 2 + deliveryCost);
    expect(order.delivery.type).toBe("courier");
    expect(order.delivery.tariffCode).toBe(tariff.tariff_code);
    // Город обязан быть внутри адреса: иначе по строке «улица, дом» доставку не собрать.
    expect(order.delivery.address).toContain("Москва");

    // В СДЭК ушло два места с реальными весом и габаритами упакованного ханга. Смотрим
    // расчёт по конкретному тарифу: список тарифов кешируется по направлению и на второй
    // такой же город запроса уже не будет, а этот уходит на каждый расчёт.
    const calls = (await mocks.requests()).filter((r) => r.kind === "cdek-tariff-priced");
    const last = calls.at(-1) as unknown as { packages: { weight: number; length: number }[] };
    expect(last.packages).toHaveLength(2);
    expect(last.packages[0].weight).toBe(8400);
    expect(last.packages[0].length).toBe(58);
  });

  test("без согласий, доставки и подтверждённого телефона заказ не уходит", async ({
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

    await page.getByRole("button", { name: "Оформить заказ" }).click();

    await expect(page.getByText("Нужно согласие на обработку персональных данных")).toBeVisible();
    await expect(page.getByText(/Ознакомлены с офертой|Нужно подтвердить, что вы ознакомлены/)).toBeVisible();
    await expect(page.getByText("Выберите способ доставки")).toBeVisible();
    await expect(page.getByText("Подтвердите телефон")).toBeVisible();

    // Ничего не создалось: заказов в базе столько же, сколько было до попытки.
    expect((await shop.orders()).length).toBe(ordersBefore);
    await expect(page).toHaveURL(/\/checkout$/);
  });

  test("вошедшему покупателю телефон подставляется уже подтверждённым", async ({
    page,
    seed,
    mocks,
    storefront,
    phone,
  }) => {
    // Сначала обычный вход по звонку — он же заводит аккаунт при первом подтверждении.
    await page.goto("/auth");
    await page.getByPlaceholder("Телефон").pressSequentially(phone.replace("+7", ""), { delay: 20 });
    await page.getByRole("button", { name: "Продолжить" }).click();
    // Ждём окно со звонком: проверка в SMS.ru должна успеть завестись, иначе
    // подтверждать ещё нечего.
    await expect(page.getByRole("heading", { name: "Позвоните нам" })).toBeVisible();
    await mocks.confirmCall(phone);
    await expect(page).toHaveURL(/\/profile/, { timeout: 30_000 });

    const product = seed.products.find((p) => p.slug === "e2e-kurd-10")!;
    await storefront.addToCart(product.slug);
    await storefront.goToCheckout();

    // Номер из сессии и сразу с отметкой — второй раз звонить не заставляем.
    await expect(page.getByPlaceholder("Телефон")).toBeDisabled();
    await expect(page.getByText("Подтверждён", { exact: true })).toBeVisible();
  });

  test("недоступный СДЭК не даёт оформить заказ вслепую", async ({
    page,
    seed,
    shop,
    mocks,
    storefront,
    phone,
  }) => {
    const product = seed.products.find((p) => p.slug === "e2e-kurd-10")!;
    const ordersBefore = (await shop.orders()).length;

    await storefront.addToCart(product.slug);
    await storefront.goToCheckout();
    await storefront.fillCustomer(customer(phone));
    await storefront.confirmPhone(phone);

    await mocks.fail("cdek-cities");
    await storefront.openDeliveryPicker();
    // Запрос заведомо новый: подсказки городов кешируются в Data Cache Next на сутки
    // (suggestCdekCities), и на уже спрошенном городе отказ СДЭК просто не понадобился бы.
    await page.getByPlaceholder("Город", { exact: true }).fill(`Мос${Date.now() % 100000}`);

    await expect(page.getByText(/Не удалось загрузить подсказки городов/)).toBeVisible();
    expect((await shop.orders()).length).toBe(ordersBefore);
  });
});
