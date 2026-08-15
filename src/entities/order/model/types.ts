export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Ожидает оплаты",
  paid: "Оплачен",
  shipped: "Отправлен",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

/**
 * Характеристики товара опциональны: связь раскрывается только при depth >= 1, а сам товар
 * к моменту просмотра заказа мог быть удалён из каталога. Заказ при этом обязан
 * показываться — это история покупок, а не витрина.
 */
export interface OrderItem {
  productName: string;
  productSlug?: string;
  scaleNotes?: string;
  notesCount?: number;
  tuningHz?: "440" | "432";
  qty: number;
  price: number;
}

export interface OrderDelivery {
  label: string;
  address?: string;
  cost: number;
  pvzCode?: string;
}

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  delivery?: OrderDelivery;
  /** Номер накладной СДЭК. Присваивается асинхронно — у только что оплаченного заказа его ещё нет. */
  cdekNumber?: string;
}
