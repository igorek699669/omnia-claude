import { test, expect, waitForAppReady, type Shop, type Storefront, type SeededProduct } from "../fixtures";
import { expectedTariff } from "../mocks/cdek-fixtures.mjs";

/**
 * Всё, что происходит по факту оплаты: списание остатка, регистрация отправления в СДЭК и
 * письма. Это самый дорогой участок — ошибка здесь либо теряет оплаченный заказ, либо
 * продаёт инструмент, которого нет.
 */

const MOSCOW = 44;
const MOSCOW_PVZ = "Москва, ул. Тверская, 12";

async function placeOrder(
  storefront: Storefront,
  shop: Shop,
  product: SeededProduct,
  phone: string,
): Promise<{ id: number; paymentId: string; total: number }> {
  await storefront.addToCart(product.slug);
  await storefront.goToCheckout();
  await storefront.fillCustomer({
    lastName: "Иванов",
    firstName: "Пётр",
    email: "buyer@omnia.test",
    phone,
  });
  await storefront.confirmPhone(phone);
  await storefront.choosePvz("Москва", MOSCOW_PVZ);
  await storefront.acceptConsents();
  await storefront.submitOrder();

  const order = await shop.lastOrder();
  return { id: order.id, paymentId: order.paymentId!, total: order.total };
}

test.describe("оплата заказа", () => {
  test("оплата списывает остаток, регистрирует отправление и рассылает письма", async ({
    page,
    seed,
    shop,
    mocks,
    storefront,
    phone,
  }) => {
    const product = seed.products.find((p) => p.slug === "e2e-kurd-10")!;
    const tariff = expectedTariff(MOSCOW, "pvz", 1);

    const placed = await placeOrder(storefront, shop, product, phone);
    await storefront.payAtCheckout();

    // Покупатель видит результат оплаты.
    await expect(page.getByRole("heading", { name: "Оплата прошла успешно" })).toBeVisible({ timeout: 30_000 });

    const order = await shop.waitForOrderStatus(placed.id, "paid");
    expect(order.total).toBe(product.price + tariff.delivery_sum);

    // Инструмент штучный — остаток уменьшился ровно на купленное.
    const stock = await shop.product(product.slug);
    expect(stock.stockQty).toBe(product.stockQty - 1);

    // Отправление ушло по тому же тарифу и в тот же пункт выдачи, что видел покупатель.
    const shipments = await mocks.shipments();
    expect(shipments).toHaveLength(1);
    expect(shipments[0].number).toBe(String(order.id));
    expect(shipments[0].body.tariff_code).toBe(tariff.tariff_code);
    expect(shipments[0].body.delivery_point).toBe("MSK1");
    expect(shipments[0].body.packages).toHaveLength(1);
    expect(shipments[0].body.packages[0].weight).toBe(8400);
    // СДЭК ждёт номер без разметки — в заказе он лежит в том виде, как его набрали.
    expect(shipments[0].body.recipient.phones[0].number).toBe(phone);
    expect(shipments[0].body.recipient.email).toBe("buyer@omnia.test");

    // Накладная и её uuid сохранены в заказе — по ним потом отслеживается доставка.
    expect(order.cdekUuid).toBe(shipments[0].uuid);
    expect(order.cdekNumber).toBe(shipments[0].cdekNumber);

    // Письма: продавцу — состав заказа, покупателю — подтверждение.
    const emails = await mocks.waitForEmails(2);
    expect(emails).toHaveLength(2);
    const toSeller = emails.find((e) => e.to.some((address) => address.includes("seller@omnia.test")))!;
    const toBuyer = emails.find((e) => e.to.some((address) => address.includes("buyer@omnia.test")))!;
    expect(toSeller, "продавец должен узнать об оплаченном заказе").toBeTruthy();
    expect(toSeller.subject).toContain(String(order.id));
    expect(toSeller.body).toContain(product.name);
    expect(toBuyer, "покупатель должен получить подтверждение").toBeTruthy();

    // Оплаченные позиции ушли из корзины сами.
    await page.goto("/cart");
    await waitForAppReady(page);
    await expect(page.getByText("В корзине пока пусто.")).toBeVisible();
  });

  test("повторная доставка вебхука ничего не меняет", async ({
    seed,
    shop,
    mocks,
    storefront,
    phone,
  }) => {
    const product = seed.products.find((p) => p.slug === "e2e-kurd-10")!;

    const placed = await placeOrder(storefront, shop, product, phone);
    await storefront.payAtCheckout();
    await shop.waitForOrderStatus(placed.id, "paid");
    await mocks.waitForEmails(2);

    const stockAfterFirst = (await shop.product(product.slug)).stockQty;

    // Касса вправе прислать то же событие ещё раз — идемпотентность держит finalizePaidOrder.
    await mocks.pay(placed.paymentId);
    await mocks.pay(placed.paymentId);

    expect((await shop.product(product.slug)).stockQty).toBe(stockAfterFirst);
    expect(await mocks.shipments()).toHaveLength(1);
    expect(await mocks.emails()).toHaveLength(2);
    expect((await shop.order(placed.id)).status).toBe("paid");
  });

  test("отменённый платёж отменяет заказ и не трогает остаток", async ({
    page,
    seed,
    shop,
    mocks,
    storefront,
    phone,
  }) => {
    const product = seed.products.find((p) => p.slug === "e2e-kurd-10")!;

    const placed = await placeOrder(storefront, shop, product, phone);
    await storefront.cancelAtCheckout();

    await expect(page.getByRole("heading", { name: "Оплата не прошла" })).toBeVisible({ timeout: 30_000 });
    await shop.waitForOrderStatus(placed.id, "cancelled");

    expect((await shop.product(product.slug)).stockQty).toBe(product.stockQty);
    expect(await mocks.shipments()).toHaveLength(0);
    expect(await mocks.emails()).toHaveLength(0);
  });

  test("не дошедший вебхук досверяется из личного кабинета", async ({
    page,
    seed,
    shop,
    mocks,
    storefront,
    phone,
  }) => {
    const product = seed.products.find((p) => p.slug === "e2e-kurd-10")!;

    // Вебхук не настроен/не дошёл — деньги списаны, а заказ навсегда «Ожидает оплаты».
    // Чинит это досверка: профиль спрашивает у кассы, что там на самом деле.
    await mocks.setWebhook(false);

    const placed = await placeOrder(storefront, shop, product, phone);
    await storefront.payAtCheckout();

    expect((await shop.order(placed.id)).status).toBe("pending");

    // Подтверждение телефона на чекауте завело сессию — заказ виден в кабинете.
    await page.goto("/profile");
    await expect(page.getByText("Оплачен")).toBeVisible({ timeout: 30_000 });

    const order = await shop.waitForOrderStatus(placed.id, "paid");
    expect((await shop.product(product.slug)).stockQty).toBe(product.stockQty - 1);
    // Досверка ведёт по тому же пути, что и вебхук: отправление и письма тоже уходят.
    expect(order.cdekUuid).toBeTruthy();
    expect(await mocks.waitForEmails(2)).toHaveLength(2);
  });

  test("недоступный СДЭК не отменяет уже принятую оплату", async ({
    seed,
    shop,
    mocks,
    storefront,
    phone,
  }) => {
    const product = seed.products.find((p) => p.slug === "e2e-kurd-10")!;
    await mocks.fail("cdek-orders");

    const placed = await placeOrder(storefront, shop, product, phone);
    await storefront.payAtCheckout();

    // Деньги приняты — откатывать заказ из-за чужого сбоя нельзя.
    const order = await shop.waitForOrderStatus(placed.id, "paid");
    expect(order.cdekUuid).toBeFalsy();
    expect((await shop.product(product.slug)).stockQty).toBe(product.stockQty - 1);

    // И продавец всё равно узнаёт о заказе — иначе сбой доставки стал бы потерей продажи.
    const emails = await mocks.waitForEmails(2);
    expect(emails.some((e) => e.to.some((address) => address.includes("seller@omnia.test")))).toBe(true);
  });
});
