export function formatPrice(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Стоимость доставки. Ноль — это не «0 ₽», а обещание покупателю: доставка бесплатна
 * (чекбокс «Бесплатная доставка» у товара в Payload).
 */
export function formatDeliveryCost(value: number): string {
  return value > 0 ? formatPrice(value) : "Бесплатно";
}

export function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(value),
  );
}
