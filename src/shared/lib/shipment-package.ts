export interface PackageBox {
  weightGrams: number;
  boxCm: { length: number; width: number; height: number };
}

/**
 * Каждый ханг едет в собственном жёстком кофре (см. копирайт src/pages/delivery) —
 * фиксированные реальные вес и габариты упакованного инструмента, один кофр на единицу товара.
 *
 * Лежит в shared, а не в select-delivery: те же коробки нужны и калькулятору тарифа на
 * чекауте (features/select-delivery), и регистрации отправления после оплаты
 * (features/checkout) — импорт между слайсами одного слоя в FSD запрещён.
 */
export const PACKAGE_WEIGHT_GRAMS = 8400;
export const PACKAGE_BOX_CM = { length: 58, width: 58, height: 37 };

export function deriveShipmentPackages(items: { qty: number }[]): PackageBox[] {
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  return Array.from({ length: totalQty }, () => ({
    weightGrams: PACKAGE_WEIGHT_GRAMS,
    boxCm: PACKAGE_BOX_CM,
  }));
}
