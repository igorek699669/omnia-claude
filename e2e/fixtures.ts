import { test as base, expect, type Page } from "@playwright/test";

/**
 * Общая обвязка E2E: доступ к заглушкам внешних сервисов, чтение данных через настоящий
 * REST Payload под админом и шаги покупателя, которые повторяются в разных сценариях.
 *
 * Никаких обходных путей: корзина наполняется кликами, форма заполняется вводом, заказ
 * уходит настоящим Server Action. Прямые запросы применяются только там, где тест
 * проверяет результат (что лежит в базе, что ушло в СДЭК, какое письмо получил продавец)
 * или изображает внешнее событие (покупатель дозвонился, касса приняла оплату).
 */

const MOCKS_URL = `http://127.0.0.1:${process.env.MOCKS_PORT ?? 4010}`;
const READY_URL = `http://127.0.0.1:${process.env.E2E_READY_PORT ?? 3101}`;

export interface SeededProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  oldPrice?: number;
  notesCount: number;
  tuningHz: string;
  stockQty: number;
  scaleNotes: string;
}

export interface Seed {
  appUrl: string;
  admin: { email: string; password: string };
  products: SeededProduct[];
}

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const text = await res.text();
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${url} → ${res.status}: ${text}`);
  return (text ? JSON.parse(text) : null) as T;
}

// ── заглушки внешних сервисов ───────────────────────────────────────────────────────────

export interface CapturedEmail {
  from: string;
  to: string[];
  subject: string;
  body: string;
  raw: string;
}

export interface CdekShipment {
  uuid: string;
  number: string;
  cdekNumber: string;
  body: {
    tariff_code: number;
    delivery_point?: string;
    to_location?: { code: number; address?: string };
    shipment_point?: string;
    from_location?: { code: number };
    recipient: { name: string; phones: { number: string }[]; email: string };
    packages: { weight: number; length: number; width: number; height: number; items: unknown[] }[];
  };
}

export interface YookassaPayment {
  id: string;
  status: "pending" | "succeeded" | "canceled";
  amount: { value: string; currency: string };
  description: string;
  metadata?: Record<string, string>;
}

export class Mocks {
  private post<T>(path: string, body?: unknown) {
    return json<T>(`${MOCKS_URL}/__control${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
  }

  reset() {
    return this.post<{ ok: true }>("/reset");
  }

  /** «Покупатель дозвонился на номер SMS.ru» — единственный способ подтвердить номер. */
  confirmCall(phone: string) {
    return this.post<{ ok: true; checkId: string }>("/callcheck/confirm", { phone });
  }

  callChecks() {
    return this.post<{ id: string; phone: string; confirmed: boolean }[]>("/callcheck/list");
  }

  payments() {
    return this.post<YookassaPayment[]>("/yookassa/payments");
  }

  /** Оплата платежа «снаружи» — так же, как если бы покупатель нажал в кассе. */
  pay(paymentId: string) {
    return this.post<{ ok: true; webhook: unknown }>("/yookassa/pay", { paymentId });
  }

  cancelPayment(paymentId: string) {
    return this.post<{ ok: true }>("/yookassa/cancel", { paymentId });
  }

  /** Выключенный вебхук изображает ситуацию «касса не достучалась до магазина». */
  setWebhook(enabled: boolean) {
    return this.post<{ ok: true }>("/yookassa/webhook", { enabled });
  }

  shipments() {
    return this.post<CdekShipment[]>("/cdek/shipments");
  }

  emails() {
    return this.post<CapturedEmail[]>("/emails");
  }

  requests() {
    return this.post<{ kind: string; [key: string]: unknown }[]>("/requests");
  }

  /** Изобразить отказ сервиса: "cdek-orders", "cdek-tariff", "sms-ru", "yookassa-get" и т.п. */
  fail(target: string, enabled = true) {
    return this.post<{ ok: true }>("/fail", { target, enabled });
  }

  /** Письма приходят чуть позже ответа сервера — ждём появления нужного количества. */
  async waitForEmails(count: number, timeoutMs = 20_000): Promise<CapturedEmail[]> {
    const deadline = Date.now() + timeoutMs;
    let emails = await this.emails();
    while (emails.length < count && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      emails = await this.emails();
    }
    return emails;
  }
}

// ── чтение данных магазина через REST Payload ───────────────────────────────────────────

export interface OrderDoc {
  id: number;
  status: string;
  total: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerId?: string;
  paymentId?: string;
  cdekUuid?: string;
  cdekNumber?: string;
  createdAt: string;
  delivery: {
    provider?: string;
    type?: string;
    label?: string;
    address?: string;
    cost?: number;
    pvzCode?: string;
    city?: string;
    cityCode?: number;
    tariffCode?: number;
  };
  items: { product: number | { id: number; name: string }; qty: number; price: number }[];
}

export interface ConsentDoc {
  id: number;
  orderId: string;
  personalData: boolean;
  offer: boolean;
  marketing: boolean;
  textVersion: string;
  ip?: string;
  userAgent?: string;
}

export class Shop {
  constructor(
    private readonly appUrl: string,
    private readonly token: string,
  ) {}

  static async login(seed: Seed): Promise<Shop> {
    const { token } = await json<{ token: string }>(`${seed.appUrl}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(seed.admin),
    });
    return new Shop(seed.appUrl, token);
  }

  private get<T>(path: string) {
    return json<T>(`${this.appUrl}${path}`, { headers: { Authorization: `JWT ${this.token}` } });
  }

  async orders(): Promise<OrderDoc[]> {
    const { docs } = await this.get<{ docs: OrderDoc[] }>("/api/orders?limit=100&sort=-createdAt&depth=0");
    return docs;
  }

  async lastOrder(): Promise<OrderDoc> {
    const orders = await this.orders();
    expect(orders.length, "заказ должен был появиться в базе").toBeGreaterThan(0);
    return orders[0];
  }

  order(id: number | string) {
    return this.get<OrderDoc>(`/api/orders/${id}?depth=0`);
  }

  /** Ждём, пока заказ дойдёт до ожидаемого статуса: вебхук обрабатывается асинхронно. */
  async waitForOrderStatus(id: number | string, status: string, timeoutMs = 30_000): Promise<OrderDoc> {
    const deadline = Date.now() + timeoutMs;
    let order = await this.order(id);
    while (order.status !== status && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      order = await this.order(id);
    }
    expect(order.status, `заказ ${id} должен был перейти в «${status}»`).toBe(status);
    return order;
  }

  async consents(): Promise<ConsentDoc[]> {
    const { docs } = await this.get<{ docs: ConsentDoc[] }>("/api/consents?limit=100&sort=-createdAt");
    return docs;
  }

  async product(slug: string): Promise<{ id: number; stockQty: number; inStock: boolean; name: string }> {
    const { docs } = await this.get<{ docs: { id: number; stockQty: number; inStock: boolean; name: string }[] }>(
      `/api/products?where[slug][equals]=${slug}&depth=0`,
    );
    expect(docs.length, `товар ${slug} должен быть в каталоге`).toBe(1);
    return docs[0];
  }

  /** Вернуть остаток к исходному — тесты списывают его настоящими покупками. */
  async setStock(slug: string, stockQty: number): Promise<void> {
    const product = await this.product(slug);
    await json(`${this.appUrl}/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `JWT ${this.token}` },
      body: JSON.stringify({ stockQty }),
    });
  }

  private patchOrder(id: number | string, data: Record<string, unknown>) {
    return json(`${this.appUrl}/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `JWT ${this.token}` },
      body: JSON.stringify(data),
    });
  }

  cancelOrder(id: number | string) {
    return this.patchOrder(id, { status: "cancelled" });
  }

  /** Только для сценария про расхождение суммы — подменяет итог уже созданного заказа. */
  setOrderTotal(id: number | string, total: number) {
    return this.patchOrder(id, { total });
  }

  /**
   * Возврат магазина в исходное состояние после теста.
   *
   * Незакрытый заказ — не просто мусор: пока он в «pending» и моложе получаса, его товар
   * считается зарезервированным (src/features/checkout/api/stock.ts), и следующий тест
   * получил бы «товар больше недоступен». Остатки возвращаются по той же причине —
   * оплаченные заказы их списывают по-настоящему.
   */
  async resetState(seed: Seed): Promise<void> {
    for (const order of await this.orders()) {
      if (order.status === "pending") await this.cancelOrder(order.id);
    }
    for (const product of seed.products) {
      const current = await this.product(product.slug);
      if (current.stockQty !== product.stockQty) await this.setStock(product.slug, product.stockQty);
    }
  }
}

// ── шаги покупателя ─────────────────────────────────────────────────────────────────────

/**
 * Ждёт, пока страница «оживёт» после гидратации.
 *
 * Нужно почти везде: до гидратации React ещё не слушает события, и ввод в поле или клик
 * по кнопке просто пропадает — форма остаётся пустой, а диалог не открывается. Признак
 * взят из шапки: пока сессия проверяется, там скелетон, и только потом появляется
 * «Войти» или кнопка аккаунта — то есть клиентский код уже отработал.
 */
export async function waitForAppReady(page: Page): Promise<void> {
  const header = page.locator("header");
  await expect(
    header.getByRole("link", { name: "Войти" }).or(header.getByRole("button", { name: "Аккаунт" })),
  ).toBeVisible({ timeout: 30_000 });
}

export interface Customer {
  lastName: string;
  firstName: string;
  email: string;
  phone: string;
}

export class Storefront {
  constructor(
    readonly page: Page,
    private readonly mocks: Mocks,
  ) {}

  /** Открывает страницу и дожидается гидратации — дальше с ней можно работать. */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
    await waitForAppReady(this.page);
  }

  /** Кладёт товар в корзину со страницы товара — тем же кликом, что и покупатель. */
  async addToCart(slug: string): Promise<void> {
    await this.goto(`/product/${slug}`);
    await this.page.getByRole("button", { name: "Добавить в корзину" }).click();
    await expect(this.page.getByRole("link", { name: "В корзине — оформить заказ" })).toBeVisible();
  }

  /**
   * Из корзины на чекаут — именно кликом: ссылка записывает выбранные позиции в стор
   * корзины (select), и без этого клика чекаут возьмёт не тот состав.
   */
  async goToCheckout(): Promise<void> {
    await this.goto("/cart");
    await this.page.getByRole("link", { name: /Оформить заказ/ }).click();
    await expect(this.page.getByRole("heading", { name: "Оформление заказа" })).toBeVisible();
    await waitForAppReady(this.page);
  }

  async fillCustomer(customer: Customer): Promise<void> {
    await this.page.getByPlaceholder("Фамилия").fill(customer.lastName);
    await this.page.getByPlaceholder("Имя", { exact: true }).fill(customer.firstName);
    await this.page.getByPlaceholder("you@mail.ru").fill(customer.email);
    await this.typePhone(customer.phone);
  }

  /** Поле под маской react-imask — заполняется посимвольно, fill() маску не пройдёт. */
  async typePhone(phone: string): Promise<void> {
    const field = this.page.getByPlaceholder("Телефон");
    await field.click();
    await field.pressSequentially(phone.replace(/^\+7/, ""), { delay: 20 });
  }

  /**
   * Подтверждение телефона: открываем окно со звонком, «дозваниваемся» через заглушку и
   * ждём, пока опрос поймает подтверждение. Заодно приложение выдаёт сессию.
   */
  async confirmPhone(phone: string): Promise<void> {
    await this.page.getByRole("button", { name: "Подтвердить" }).click();
    await expect(this.page.getByRole("heading", { name: "Позвоните нам" })).toBeVisible();
    await this.mocks.confirmCall(phone);
    await expect(this.page.getByText("Подтверждён", { exact: true })).toBeVisible({ timeout: 30_000 });
  }

  async openDeliveryPicker(): Promise<void> {
    await this.page.getByRole("button", { name: /Способ доставки/ }).click();
    await expect(this.page.getByRole("tab", { name: "Пункт выдачи" })).toBeVisible();
  }

  /** Город и пункт выдачи выбираются подсказками — так же, как это делает покупатель. */
  async choosePvz(city: string, pvzAddress: string): Promise<void> {
    await this.openDeliveryPicker();

    // exact: иначе поле ПВЗ с подсказкой «Сначала выберите город» тоже подходит под «Город».
    await this.page.getByPlaceholder("Город", { exact: true }).fill(city);
    await this.page.getByRole("option", { name: new RegExp(`^${city}`) }).click();

    const pvzField = this.page.getByPlaceholder(/Пункт выдачи/);
    await pvzField.click();
    await expect(this.page.getByRole("option", { name: pvzAddress })).toBeVisible({ timeout: 30_000 });
    await this.page.getByRole("option", { name: pvzAddress }).click();

    await this.page.getByRole("button", { name: "Забрать отсюда" }).click();
    await expect(this.page.getByRole("button", { name: /Способ доставки:/ })).toBeVisible();
  }

  async chooseCourier(city: string, address: string): Promise<void> {
    await this.openDeliveryPicker();
    await this.page.getByRole("tab", { name: "Курьером" }).click();

    await this.page.getByPlaceholder("Город", { exact: true }).fill(city);
    await this.page.getByRole("option", { name: new RegExp(`^${city}`) }).click();
    await this.page.getByPlaceholder("Улица, дом, квартира").fill(address);

    // Кнопки «Рассчитать стоимость» больше нет: сумма считается сама по дебаунсу, как
    // только заполнены город и адрес. Ждём именно цифру — до неё в строке «считаем…».
    await expect(this.page.getByText(/Стоимость доставки: \d/)).toBeVisible({ timeout: 30_000 });
    await this.page.getByRole("button", { name: "Применить" }).click();
    await expect(this.page.getByRole("button", { name: /Способ доставки:/ })).toBeVisible();
  }

  async acceptConsents({ marketing = false } = {}): Promise<void> {
    await this.page.getByRole("checkbox", { name: /обработку персональных данных/ }).click();
    await this.page.getByRole("checkbox", { name: /офертой/ }).click();
    if (marketing) await this.page.getByRole("checkbox", { name: /рассылкой/ }).click();
  }

  /** Отправляет заказ и ждёт редиректа на страницу оплаты. */
  async submitOrder(): Promise<void> {
    await this.page.getByRole("button", { name: "Оформить заказ" }).click();
    await expect(this.page.getByRole("heading", { name: "Тестовая касса" })).toBeVisible({ timeout: 30_000 });
  }

  async payAtCheckout(): Promise<void> {
    await this.page.getByTestId("pay").click();
    await this.page.waitForURL(/\/checkout\/success/);
  }

  async cancelAtCheckout(): Promise<void> {
    await this.page.getByTestId("cancel").click();
    await this.page.waitForURL(/\/checkout\/success/);
  }
}

// ── фикстуры ────────────────────────────────────────────────────────────────────────────

let phoneCounter = 0;

/**
 * Свой номер на каждый вызов: подтверждение номера ограничено тремя попытками на номер за
 * 15 минут (src/features/phone-auth/api/rate-limit.ts), и общий номер уронил бы соседние
 * тесты. Диапазон 79000000000+ заведомо не пересекается с чем-либо настоящим.
 */
let ipCounter = 0;

/**
 * Свой адрес на каждый тест.
 *
 * Запуск звонка ограничен ещё и по IP — 10 попыток в час (rate-limit.ts), и без этого весь
 * прогон выглядел бы для приложения одним человеком: тесты после десятого подтверждения
 * телефона получали бы «Слишком много попыток». Разные покупатели приходят с разных
 * адресов, так что заголовок здесь не обход проверки, а воспроизведение реальности.
 * Берётся последний элемент X-Forwarded-For (его в бою дописывает Caddy) — см. request-ip.ts.
 */
export function uniqueIp(): string {
  ipCounter += 1;
  const base = Math.floor(Math.random() * 250) + 1;
  return `10.${base}.${Math.floor(ipCounter / 250) % 250}.${(ipCounter % 250) + 1}`;
}

export function uniquePhone(): string {
  phoneCounter += 1;
  // Случайная часть, а не просто счётчик: Playwright перезапускает воркер после падения,
  // счётчик обнулился бы, номер повторился — и следующий тест упёрся бы в лимит попыток,
  // оставленный предыдущим прогоном.
  const random = Math.floor(Math.random() * 1_000_000);
  return `+79${String(random).padStart(6, "0")}${String(phoneCounter % 1000).padStart(3, "0")}`;
}

interface Fixtures {
  mocks: Mocks;
  shop: Shop;
  storefront: Storefront;
  phone: string;
  cleanup: Shop;
}

interface WorkerFixtures {
  seed: Seed;
}

export const test = base.extend<Fixtures, WorkerFixtures>({
  // Каждый тест — отдельный покупатель со своего адреса, см. uniqueIp().
  contextOptions: async ({ contextOptions }, use) => {
    await use({ ...contextOptions, extraHTTPHeaders: { "x-forwarded-for": uniqueIp() } });
  },

  seed: [
    async ({}, use) => {
      // Порт готовности поднимается только после сида каталога — см. e2e/scripts/serve.mjs.
      await use(await json<Seed>(READY_URL));
    },
    { scope: "worker" },
  ],

  mocks: async ({}, use) => {
    const mocks = new Mocks();
    // Чистое состояние на каждый тест: письма, платежи и отправления не должны
    // «перетекать» из соседнего сценария, иначе проверки количества врут.
    await mocks.reset();
    await use(mocks);
  },

  shop: async ({ seed }, use) => {
    const shop = await Shop.login(seed);
    await use(shop);
    await shop.resetState(seed);
  },

  storefront: async ({ page, mocks }, use) => {
    await use(new Storefront(page, mocks));
  },

  phone: async ({}, use) => {
    await use(uniquePhone());
  },

  // Подключается сама к каждому тесту — только ради уборки в Shop.resetState: незакрытый
  // заказ держит резерв на товар, и следующий сценарий получил бы «товар недоступен».
  cleanup: [
    async ({ shop }, use) => {
      await use(shop);
    },
    { auto: true },
  ],
});

export { expect };
