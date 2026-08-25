export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Ожидает оплаты",
  paid: "Оплачен",
  shipped: "Отправлен",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

/**
 * Сколько ждём, что заказ со статусом «Ожидает оплаты» ещё закроется сам. Вебхук ЮKassa
 * приходит через секунды после оплаты, так что получаса хватает с запасом; всё, что висит
 * дольше, — брошенная на странице оплаты корзина.
 */
const PAYMENT_SETTLE_WINDOW_MS = 30 * 60 * 1000;

/**
 * Заказ, оплата которого прямо сейчас может закрыться вебхуком. По этому признаку профиль
 * решает, опрашивать ли сервер: висящий третьи сутки pending сам не оживёт.
 *
 * now — параметром со значением по умолчанию, а не Date.now() у вызывающего: иначе время
 * читалось бы во время рендера компонента, что запрещено правилами React (и ловится
 * react-hooks/purity).
 */
export function isAwaitingPayment(order: Order, now: number = Date.now()): boolean {
  return (
    order.status === "pending" && now - new Date(order.createdAt).getTime() < PAYMENT_SETTLE_WINDOW_MS
  );
}

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
