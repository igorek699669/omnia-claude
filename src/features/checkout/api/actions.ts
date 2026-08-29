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
  isDadataConfigured,
  suggestDadataAddresses,
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

  // Инструменты штучные, поэтому «в наличии» — это stockQty за вычетом того, что держат
  // чужие незакрытые заказы: иначе двое доходят до оплаты одного и того же ханга. Сбой
  // запроса намеренно срывает заказ — продать в обход проверки хуже, чем не продать.
  let reserved: Map<string, number>;
  try {
    reserved = await reservedQtyByProduct(payload);
  } catch (err) {
    console.error("[createOrderPayment] не удалось посчитать резерв по незакрытым заказам:", err);
    return { error: "Не удалось проверить наличие. Попробуйте ещё раз." };
  }

  // Цену и наличие всегда берём из Payload — корзине из localStorage не доверяем. product
  // именно number: на Postgres id числовой, и связь в коллекции orders ждёт число.
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

  // Пункт выдачи обязан лежать в городе, по которому считается тариф: это два независимых
  // поля из браузера, и дешёвый город рядом с отправителем прекрасно уживается с пунктом на
  // другом конце страны. У курьера сверять нечего — адрес уходит в СДЭК с кодом города.
  if (delivery.type === "pvz") {
    if (!delivery.pvzCode) {
      return { error: "Не выбран пункт выдачи" };
    }
    try {
      const pvz = await findCdekPvz(delivery.pvzCode);
      if (!pvz) {
        return { error: "Пункт выдачи не найден — выберите способ доставки заново" };
      }
      // Отклоняем только доказанное несовпадение: если города в ответе не оказалось, заказ
      // проходит — рубить продажу из-за того, что мы чего-то не узнали, нельзя.
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

  // У курьера адрес набран руками, и дальше он уходит в СДЭК как есть. Сверяем по ГАР, что
  // такой дом в городе существует: несуществующий всплыл бы уже после оплаты — отправление
  // не зарегистрировалось бы вовсе или поехало бы в никуда.
  if (delivery.type === "courier" && isDadataConfigured()) {
    try {
      // В address город уже приклеен спереди — ищем по остатку, город задан отдельным полем.
      const prefix = `${delivery.city},`;
      const street = delivery.address.toLowerCase().startsWith(prefix.toLowerCase())
        ? delivery.address.slice(prefix.length).trim()
        : delivery.address;
      const matches = await suggestDadataAddresses(delivery.city, street, 1);
      // Пустой ответ — тоже отказ: на выдуманную улицу ДаData не отдаёт ничего, а не «улицу
      // без дома», и пропускать такое значит не проверять ничего. Подсказки в поле адреса
      // ведут покупателя к варианту из реестра, так что дойти сюда можно только вводом руками.
      if (matches.length === 0) {
        return { error: "Не нашли такой адрес — выберите вариант из подсказок" };
      }
      if (!matches[0].hasHouse) {
        return { error: "Уточните адрес: нужны улица и номер дома" };
      }
    } catch (err) {
      // Сбой самой ДаData адрес виноватым не делает — заказ проходит, как и до проверки.
      console.error("[createOrderPayment] проверка адреса в ДаData не удалась:", err);
    }
  }

  // Доставку пересчитываем заново по той же причине, что и цены: cost и tariffCode приходят
  // из браузера, и подменённый запрос оформил бы доставку за 0 ₽ — счёт от СДЭК всё равно
  // пришёл бы мастерской. Из запроса берём только город и способ.
  let tariff: CdekTariff;
  try {
    tariff = await calculateCdekTariff({
      cityCode: delivery.cityCode,
      type: delivery.type,
      packages: deriveShipmentPackages(items),
      // Объявленная стоимость — сумма товаров по ценам Payload: её же укажем в items.cost.
      declaredValue: subtotal,
    });
  } catch (err) {
    console.error("[createOrderPayment] CDEK tariff recalculation failed:", err);
    return { error: "Не удалось рассчитать доставку. Попробуйте ещё раз." };
  }

  // Разошлось с тем, что покупатель видел, — списывать другую сумму молча нельзя. Допуск
  // в рубль на округление у СДЭК.
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

  // Лог согласий — доказательство законного основания на обработку ПДн (152-ФЗ, доказывает
  // оператор). Сбой записи срывает заказ: иначе взяли бы оплату, не имея подтверждения.
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
