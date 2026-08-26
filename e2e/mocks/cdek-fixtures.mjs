/**
 * Справочник, который в E2E изображает СДЭК.
 *
 * Настоящий контур сюда не годится: тарифы там плавают, песочница периодически лежит, а
 * тесты обязаны падать только от наших ошибок. Данные подобраны так, чтобы проверять
 * ровно то, ради чего код к СДЭК и ходит: город определяет цену, ПВЗ принадлежит городу,
 * каждый инструмент едет отдельным местом.
 */

/** Брянск — город отправителя (SENDER_CITY_CODE в src/shared/lib/cdek.ts). */
export const CITIES = [
  { code: 220, city: "Брянск", region: "Брянская область" },
  { code: 44, city: "Москва", region: undefined },
  { code: 75, city: "Владивосток", region: "Приморский край" },
  { code: 270, city: "Брянка", region: "Луганская Народная Республика" },
];

export const PVZ = [
  { code: "BRN1", cityCode: 220, city: "Брянск", address: "Брянск, ул. Дуки, 65", lat: 53.24, lon: 34.36 },
  { code: "MSK1", cityCode: 44, city: "Москва", address: "Москва, ул. Тверская, 12", lat: 55.76, lon: 37.61 },
  { code: "MSK2", cityCode: 44, city: "Москва", address: "Москва, Ленинский пр-т, 40", lat: 55.7, lon: 37.57 },
  { code: "VVO1", cityCode: 75, city: "Владивосток", address: "Владивосток, ул. Светланская, 29", lat: 43.11, lon: 131.88 },
];

/**
 * Цена за одно место: чем дальше от Брянска, тем дороже. Курьер дороже ПВЗ — как в жизни,
 * и это единственное, на что опираются тесты про пересчёт доставки на сервере.
 */
const PER_PACKAGE = {
  220: { pvz: 350, courier: 650 },
  44: { pvz: 690, courier: 1190 },
  75: { pvz: 1490, courier: 2290 },
  270: { pvz: 890, courier: 1490 },
};

/** delivery_mode 4 — «склад-склад» (ПВЗ), 3 — «склад-дверь» (курьер). См. src/shared/lib/cdek.ts. */
export function tariffsFor(cityCode, packagesCount) {
  const prices = PER_PACKAGE[cityCode] ?? PER_PACKAGE[44];
  const n = Math.max(1, packagesCount);
  return [
    // По два тарифа на режим: код должен выбираться самый дешёвый, а не первый попавшийся.
    { tariff_code: 136, delivery_mode: 4, delivery_sum: prices.pvz * n, period_min: 3, period_max: 5 },
    { tariff_code: 234, delivery_mode: 4, delivery_sum: prices.pvz * n + 400, period_min: 2, period_max: 3 },
    { tariff_code: 137, delivery_mode: 3, delivery_sum: prices.courier * n, period_min: 3, period_max: 5 },
    { tariff_code: 233, delivery_mode: 3, delivery_sum: prices.courier * n + 500, period_min: 2, period_max: 3 },
  ];
}

/** Самый дешёвый тариф нужного режима — то же, что должен посчитать calculateCdekTariff. */
export function expectedTariff(cityCode, type, packagesCount) {
  const mode = type === "pvz" ? 4 : 3;
  const matching = tariffsFor(cityCode, packagesCount).filter((t) => t.delivery_mode === mode);
  return matching.reduce((min, t) => (t.delivery_sum < min.delivery_sum ? t : min));
}
