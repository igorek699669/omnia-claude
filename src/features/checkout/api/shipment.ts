import { getPayload } from "payload";
import config from "@payload-config";
import { createCdekOrder, getCdekOrderNumber, deriveShipmentPackages } from "@/shared/lib";

interface ShipmentOrderDoc {
  id: number | string;
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  cdekUuid?: string | null;
  delivery: {
    provider?: string | null;
    type?: "pvz" | "courier" | null;
    address?: string | null;
    pvzCode?: string | null;
    cityCode?: number | null;
    tariffCode?: number | null;
  };
  items: { product: { id: number | string; name: string } | number | string; qty: number; price: number }[];
}

// В заказе телефон лежит как его набрали в форме, СДЭК ожидает номер без разметки.
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("8") ? `+7${digits.slice(1)}` : `+${digits}`;
}

/**
 * Регистрирует отправление по уже оплаченному заказу. Зовётся из вебхука ЮKassa: до оплаты
 * нельзя, иначе на каждый брошенный заказ у продавца висела бы накладная.
 *
 * Идемпотентна дважды: заказ с cdekUuid пропускается, а дошедшую до СДЭК, но не до нас
 * запись отобьёт сам СДЭК — number заказа у него уникален.
 */
export async function registerCdekShipment(orderId: number | string): Promise<void> {
  const payload = await getPayload({ config });

  // depth: 1 — нужны названия товаров для состава вложения, дальше связи не разворачиваем.
  const order = (await payload.findByID({
    collection: "orders",
    id: orderId,
    depth: 1,
  })) as unknown as ShipmentOrderDoc;

  // Раньше проверки статуса: повторный вызов — не ошибка, а статус мог уйти в "shipped".
  if (order.cdekUuid) return;

  // Оплату проверяем здесь, а не полагаемся на вызывающего: накладная стоит продавцу денег,
  // и по неоплаченному заказу её нельзя создать ни из вебхука, ни откуда позовут завтра.
  if (order.status !== "paid") {
    throw new Error(`Заказ ${orderId} не оплачен (статус «${order.status}») — отправление не создаётся`);
  }

  const { delivery } = order;
  if (delivery.provider !== "cdek") return;

  if (!delivery.tariffCode || !delivery.cityCode || !delivery.type) {
    throw new Error(
      `Заказ ${orderId}: в доставке нет тарифа/города — отправление не зарегистрировать`,
    );
  }
  if (delivery.type === "pvz" && !delivery.pvzCode) {
    throw new Error(`Заказ ${orderId}: доставка в ПВЗ без кода пункта выдачи`);
  }

  const uuid = await createCdekOrder({
    orderNumber: String(order.id),
    tariffCode: delivery.tariffCode,
    type: delivery.type,
    cityCode: delivery.cityCode,
    address: delivery.address ?? undefined,
    pvzCode: delivery.pvzCode ?? undefined,
    recipientName: order.customerName,
    recipientPhone: normalizePhone(order.customerPhone),
    recipientEmail: order.customerEmail,
    items: order.items.map((item) => ({
      wareKey: String(typeof item.product === "object" ? item.product.id : item.product),
      name: typeof item.product === "object" ? item.product.name : "Ханг",
      qty: item.qty,
      price: item.price,
    })),
    packages: deriveShipmentPackages(order.items),
  });

  await payload.update({ collection: "orders", id: order.id, data: { cdekUuid: uuid } });

  // Номер обычно ещё не присвоен — пробуем разово, иначе подтянется позже по uuid.
  try {
    const cdekNumber = await getCdekOrderNumber(uuid);
    if (cdekNumber) {
      await payload.update({ collection: "orders", id: order.id, data: { cdekNumber } });
    }
  } catch (err) {
    console.error(`[cdek] не удалось получить номер накладной для заказа ${order.id}:`, err);
  }
}

/** Досинхронизация номера накладной — дёргается из карточки заказа, планировщика нет. */
export async function syncCdekOrderNumber(orderId: number | string): Promise<string | null> {
  const payload = await getPayload({ config });
  const order = (await payload.findByID({
    collection: "orders",
    id: orderId,
    depth: 0,
  })) as unknown as { id: number | string; cdekUuid?: string | null; cdekNumber?: string | null };

  if (!order.cdekUuid || order.cdekNumber) return order.cdekNumber ?? null;

  const cdekNumber = await getCdekOrderNumber(order.cdekUuid);
  if (cdekNumber) {
    await payload.update({ collection: "orders", id: order.id, data: { cdekNumber } });
  }
  return cdekNumber;
}
