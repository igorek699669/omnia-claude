import { getPayload } from "payload";
import config from "@payload-config";
import type { Order, OrderStatus } from "../model/types";

/**
 * Ручная форма документа orders из Payload — без зависимости от payload-types.ts,
 * см. аналогичный комментарий в entities/product/api/payload.ts.
 * items[].product раскрывается до полного Product-документа при depth >= 1 (по умолчанию).
 */
interface ProductRef {
  id: number | string;
  name: string;
  slug?: string | null;
  scaleNotes?: string | null;
  notesCount?: number | null;
  tuningHz?: "440" | "432" | null;
}

interface OrderDoc {
  id: number | string;
  createdAt: string;
  status: string;
  total: number;
  cdekNumber?: string | null;
  delivery?: {
    label?: string | null;
    address?: string | null;
    cost?: number | null;
    pvzCode?: string | null;
  } | null;
  items: {
    product: ProductRef | number | string | null;
    qty: number;
    price: number;
  }[];
}

function toOrderItem(item: OrderDoc["items"][number]) {
  // Связь раскрыта только при depth >= 1; если товар удалён из каталога, здесь придёт null.
  const product = typeof item.product === "object" && item.product ? item.product : null;
  return {
    productName: product?.name ?? "Товар",
    productSlug: product?.slug ?? undefined,
    scaleNotes: product?.scaleNotes ?? undefined,
    notesCount: product?.notesCount ?? undefined,
    tuningHz: product?.tuningHz ?? undefined,
    qty: item.qty,
    price: item.price,
  };
}

function toOrder(doc: OrderDoc): Order {
  const delivery = doc.delivery;
  return {
    id: String(doc.id),
    createdAt: doc.createdAt,
    status: doc.status as OrderStatus,
    total: doc.total,
    items: doc.items.map(toOrderItem),
    delivery: delivery?.label
      ? {
          label: delivery.label,
          address: delivery.address ?? undefined,
          cost: delivery.cost ?? 0,
          pvzCode: delivery.pvzCode ?? undefined,
        }
      : undefined,
    cdekNumber: doc.cdekNumber ?? undefined,
  };
}

export async function getOrdersByCustomer(customerId: string): Promise<Order[]> {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "orders",
    where: { customerId: { equals: customerId } },
    sort: "-createdAt",
    limit: 50,
  });
  return (result.docs as OrderDoc[]).map(toOrder);
}
