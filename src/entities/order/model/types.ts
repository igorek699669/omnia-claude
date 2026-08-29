export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Ожидает оплаты",
  paid: "Оплачен",
  shipped: "Отправлен",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

/**
 * Сколько ждём, что «Ожидает оплаты» закроется само. Вебхук ЮKassa приходит через секунды,
 * так что получаса хватает с запасом; всё, что висит дольше, — брошенная корзина.
 */
export const PAYMENT_SETTLE_WINDOW_MS = 30 * 60 * 1000;

/**
 * Заказ, оплата которого прямо сейчас может закрыться вебхуком: по этому признаку профиль
 * решает, опрашивать ли сервер. now параметром, а не Date.now() у вызывающего: иначе время
 * читалось бы во время рендера, что запрещено правилами React (ловит react-hooks/purity).
 */
export function isAwaitingPayment(order: Order, now: number = Date.now()): boolean {
  return (
    order.status === "pending" && now - new Date(order.createdAt).getTime() < PAYMENT_SETTLE_WINDOW_MS
  );
}

/**
 * Характеристики опциональны: связь раскрывается только при depth >= 1, а товар мог быть
 * удалён из каталога. Заказ обязан показываться — это история покупок, а не витрина.
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
