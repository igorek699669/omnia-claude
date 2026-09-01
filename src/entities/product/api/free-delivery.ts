import { getPayload } from "payload";
import config from "@payload-config";

/**
 * Есть ли в корзине товар с чекбоксом «бесплатная доставка» (Payload → Товары). Доставка при
 * этом считается, выбирается и регистрируется как обычно — она просто не попадает в счёт
 * покупателю, поэтому решать это может только сервер: из браузера флаг не принимаем.
 *
 * Бесплатной становится вся доставка заказа: посылка одна на все товары, разложить её по
 * позициям нельзя. Товара с таким id может уже не быть — на цену доставки он тогда не влияет,
 * наличие проверит createOrderPayment.
 */
export async function hasFreeDelivery(items: { productId: string }[]): Promise<boolean> {
  const payload = await getPayload({ config });

  for (const item of items) {
    try {
      const doc = (await payload.findByID({
        collection: "products",
        id: item.productId,
        depth: 0,
      })) as { freeDelivery?: boolean | null };
      if (doc.freeDelivery) return true;
    } catch {
      // товара нет — на стоимость доставки он не влияет
    }
  }

  return false;
}
