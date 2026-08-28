"use server";

import { headers } from "next/headers";
import { getPayload } from "payload";
import config from "@payload-config";
import { auth } from "@/auth";
import { checkoutInputSchema, type CheckoutInput, type CheckoutResult } from "../model/types";
import { reservedQtyByProduct } from "./stock";
import {
  createYookassaPayment,
  calculateCdekTariff,
  findCdekPvz,
  deriveShipmentPackages,
  clientIp,
  siteUrl,
  CONSENT_TEXT_VERSION,
} from "@/shared/lib";
import type { CdekTariff } from "@/shared/lib";

interface ProductDoc {
  id: number | string;
  name: string;
  price: number;
  stockQty?: number | null;
}

interface OrderDoc {
  id: number | string;
  status: string;
  total: number;
  items: { product: number | string; qty: number }[];
}

export async function createOrderPayment(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = checkoutInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Некорректные данные заказа" };
  }
  const { items, customer, delivery, consents } = parsed.data;
  const requestHeaders = await headers();

  const payload = await getPayload({ config });

  // Инструменты штучные, поэтому «в наличии» — это не stockQty, а stockQty за вычетом того,
  // что держат чужие незакрытые заказы. Иначе двое покупателей спокойно доходят до оплаты
  // одного и того же ханга, и второму придётся возвращать деньги.
  //
  // Сбой этого запроса намеренно срывает заказ, а не пропускает его: продать в обход
  // проверки хуже, чем не продать. Отказ при этом громкий — первый же тестовый заказ
  // покажет, если запрос составлен неверно.
  let reserved: Map<string, number>;
  try {
    reserved = await reservedQtyByProduct(payload);
  } catch (err) {
    console.error("[createOrderPayment] не удалось посчитать резерв по незакрытым заказам:", err);
    return { error: "Не удалось проверить наличие. Попробуйте ещё раз." };
  }

  // Цену и наличие всегда берём из Payload — клиентским данным (localStorage-корзина) не доверяем.
  // product именно number: ProductDoc.id объявлен `number | string` ради независимости от БД,
  // но на Postgres id всегда числовой, и связь в коллекции orders ждёт число.
  const orderItems: { product: number; qty: number; price: number }[] = [];
  let subtotal = 0;
  for (const item of items) {
    let doc: ProductDoc | null = null;
    try {
      doc = (await payload.findByID({ collection: "products", id: item.productId })) as ProductDoc;
    } catch {
      doc = null;
    }
    const available = doc ? (doc.stockQty ?? 0) - (reserved.get(String(doc.id)) ?? 0) : 0;
    if (!doc || available < item.qty) {
      return { error: `Товар «${doc?.name ?? item.productId}» больше недоступен в нужном количестве` };
    }
    orderItems.push({ product: Number(doc.id), qty: item.qty, price: doc.price });
    subtotal += doc.price * item.qty;
  }

  // Пункт выдачи обязан лежать в том городе, по которому считается тариф: это два независимых
  // поля из браузера, и без сверки дешёвый город рядом с отправителем прекрасно уживается
  // с пунктом выдачи в другом конце страны. При курьерской доставке сверять нечего — адрес
  // и так уходит в СДЭК вместе с кодом города.
  if (delivery.type === "pvz") {
    if (!delivery.pvzCode) {
      return { error: "Не выбран пункт выдачи" };
    }
    try {
      const pvz = await findCdekPvz(delivery.pvzCode);
      if (!pvz) {
        return { error: "Пункт выдачи не найден — выберите способ доставки заново" };
      }
      // Отклоняем только доказанное несовпадение. Если города в ответе СДЭК не оказалось,
      // заказ проходит: тариф всё равно пересчитан ниже, а рубить продажу из-за того, что
      // мы чего-то не узнали, нельзя. Строчка в логах — чтобы это не осталось незамеченным.
      if (pvz.cityCode === null) {
        console.warn(`[createOrderPayment] СДЭК не вернул город для ПВЗ ${delivery.pvzCode} — сверка пропущена`);
      } else if (pvz.cityCode !== delivery.cityCode) {
        return { error: "Пункт выдачи не совпадает с городом — выберите способ доставки заново" };
      }
    } catch (err) {
      console.error("[createOrderPayment] CDEK pickup point lookup failed:", err);
      return { error: "Не удалось проверить пункт выдачи. Попробуйте ещё раз." };
    }
  }

  // Доставку пересчитываем здесь заново, по той же причине, по которой цены товаров берутся
  // из Payload: cost и tariffCode приходят из браузера, и подменённый запрос иначе оформил бы
  // заказ с доставкой за 0 ₽ — счёт от СДЭК всё равно пришёл бы мастерской. Город и способ
  // берём из запроса (их покупатель и правда выбирает), а сумму и тариф — только свои.
  let tariff: CdekTariff;
  try {
    tariff = await calculateCdekTariff({
      cityCode: delivery.cityCode,
      type: delivery.type,
      packages: deriveShipmentPackages(items),
      // Объявленная стоимость — сумма товаров по ценам Payload: ровно её мы укажем в
      // items.cost при регистрации отправления, и страховой сбор СДЭК считает с неё же.
      declaredValue: subtotal,
    });
  } catch (err) {
    console.error("[createOrderPayment] CDEK tariff recalculation failed:", err);
    return { error: "Не удалось рассчитать доставку. Попробуйте ещё раз." };
  }

  // Разошлось с тем, что покупатель видел на чекауте, — списывать другую сумму молча нельзя,
  // просим выбрать доставку заново. У честного покупателя не срабатывает: тариф не меняется
  // за время оформления. Допуск в рубль — на округление на стороне СДЭК.
  if (Math.abs(tariff.cost - delivery.cost) > 1) {
    return { error: "Стоимость доставки изменилась — выберите способ доставки заново" };
  }

  const total = subtotal + tariff.cost;

  let customerId: string | undefined;
  try {
    const session = await auth.api.getSession({ headers: requestHeaders });
    customerId = session?.user?.id;
  } catch {
    // сессии нет — оформляем гостевой заказ
  }

  const order = (await payload.create({
    collection: "orders",
    data: {
      customerId,
      customerName: `${customer.firstName} ${customer.lastName}`.trim(),
      customerEmail: customer.email,
      customerPhone: customer.phone,
      // Сумма и тариф — серверные: по tariffCode из заказа потом регистрируется отправление,
      // и он обязан быть тем, по которому мы сами посчитали цену.
      delivery: { ...delivery, cost: tariff.cost, tariffCode: tariff.tariffCode },
      items: orderItems,
      total,
      status: "pending",
    },
  })) as OrderDoc;

  // Лог согласий — доказательство законного основания на обработку персональных данных
  // (ФЗ №152-ФЗ, доказывать обязан оператор). Сбой записи намеренно срывает заказ: иначе
  // мы бы взяли оплату и сохранили ПДн, не имея чем подтвердить согласие.
  try {
    await payload.create({
      collection: "consents",
      data: {
        orderId: String(order.id),
        personalData: consents.personalData,
        offer: consents.offer,
        marketing: consents.marketing,
        textVersion: CONSENT_TEXT_VERSION,
        ip: clientIp(requestHeaders) ?? undefined,
        userAgent: requestHeaders.get("user-agent") ?? undefined,
      },
    });
  } catch (err) {
    console.error("[createOrderPayment] Consent logging failed:", err);
    await payload.update({ collection: "orders", id: order.id, data: { status: "cancelled" } });
    return { error: "Не удалось сохранить согласия. Попробуйте ещё раз." };
  }

  try {
    const payment = await createYookassaPayment({
      idempotenceKey: String(order.id),
      amount: total,
      description: `Заказ №${order.id} — Omnia`,
      returnUrl: `${siteUrl()}/checkout/success?orderId=${order.id}`,
      metadata: { orderId: String(order.id) },
    });

    await payload.update({ collection: "orders", id: order.id, data: { paymentId: payment.id } });

    if (!payment.confirmation?.confirmation_url) {
      return { error: "ЮKassa не вернула ссылку на оплату" };
    }
    return { confirmationUrl: payment.confirmation.confirmation_url };
  } catch (err) {
    console.error("[createOrderPayment] YooKassa payment creation failed:", err);
    await payload.update({ collection: "orders", id: order.id, data: { status: "cancelled" } });
    return { error: "Не удалось создать платёж. Попробуйте ещё раз." };
  }
}

export async function getOrderStatus(
  orderId: string,
): Promise<{ status: string; total: number; productIds: string[] } | null> {
  const payload = await getPayload({ config });
  try {
    // depth: 0 — товары в items нужны только как id, не как раскрытые документы.
    const order = (await payload.findByID({ collection: "orders", id: orderId, depth: 0 })) as OrderDoc;
    return {
      status: order.status,
      total: order.total,
      productIds: order.items.map((item) => String(item.product)),
    };
  } catch {
    return null;
  }
}
