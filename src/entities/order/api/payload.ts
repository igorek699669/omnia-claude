import { getPayload } from "payload";
import config from "@payload-config";
import type { Order, OrderStatus } from "../model/types";

/**
 * Ручная форма документа orders из Payload — без зависимости от payload-types.ts,
 * см. аналогичный комментарий в entities/product/api/payload.ts.
 * items[].product раскрывается до полного Product-документа при depth >= 1 (по умолчанию).
 */
interface OrderDoc {
  id: number | string;
  createdAt: string;
  status: string;
  total: number;
  items: {
    product: { id: number | string; name: string } | number | string | null;
    qty: number;
    price: number;
  }[];
}

function toOrder(doc: OrderDoc): Order {
  return {
    id: String(doc.id),
    createdAt: doc.createdAt,
    status: doc.status as OrderStatus,
    total: doc.total,
    items: doc.items.map((item) => ({
      productName: typeof item.product === "object" && item.product ? item.product.name : "Товар",
      qty: item.qty,
      price: item.price,
    })),
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
