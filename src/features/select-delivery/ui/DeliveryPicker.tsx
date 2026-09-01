"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { SectionTitle, Tabs, TabsList, TabsTrigger, TabsContent, Backdrop, LegalLinks, Combobox, ArrowLeftIcon } from "@/shared/ui";
import { formatDeliveryCost, DELIVERY_PROVIDER_LABELS, useDebouncedEffect } from "@/shared/lib";
import type { CdekCityMatch, CdekTariff, DadataAddress } from "@/shared/lib";
import {
  searchCitySuggestions,
  searchAddressSuggestions,
  checkAddress,
  getPvzPointsByCity,
  calculateDeliveryCost,
} from "../api/actions";
import { PvzMap } from "./PvzMap";
import { CITY_SEARCH_MIN_CHARS, ADDRESS_SEARCH_MIN_CHARS } from "../model/types";
import type { Delivery, Pvz } from "../model/types";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

// Текст СДЭК-ошибки покупателю не показываем: при недоступности контура оттуда прилетает
// HTML страницы 504 целиком, а в проде Server Action и вовсе отдаёт редактированный digest.
const CITY_SEARCH_ERROR = "Не удалось загрузить подсказки городов. Попробуйте ещё раз";
const CITY_SEARCH_DELAY_MS = 300;

export function DeliveryPicker({
  items,
  onApply,
  onBack,
}: {
  items: { productId: string; qty: number }[];
  onApply: (delivery: Delivery) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<"pvz" | "courier">("pvz");

  const [cityQuery, setCityQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<CdekCityMatch | null>(null);

  const [pvzQuery, setPvzQuery] = useState("");
  const [selectedPoint, setSelectedPoint] = useState<Pvz | null>(null);
  const [pvzTariff, setPvzTariff] = useState<CdekTariff | null>(null);

  // Город курьерской вкладки держим объектом, а не строкой: для регистрации отправления
  // нужен его код СДЭК, а по одному названию его не восстановить (города-тёзки).
  const [courierQuery, setCourierQuery] = useState("");
  const [courierCity, setCourierCity] = useState<CdekCityMatch | null>(null);
  const [address, setAddress] = useState("");
  const [courierErrors, setCourierErrors] = useState<{ city?: string; address?: string }>({});
  const [courierTariff, setCourierTariff] = useState<CdekTariff | null>(null);

  // Подсказки приходят с настоящим code (см. actions.ts) — резолвить его отдельно не нужно.
  const {
    mutate: searchCities,
    data: citySuggestions,
    isPending: isSearchingCities,
  } = useMutation({
    mutationFn: (query: string) => searchCitySuggestions(query),
    onError: () => toast.error(CITY_SEARCH_ERROR),
  });

  // Отдельная мутация для «Курьером»: тот же источник, но своё состояние подсказок.
  const {
    mutate: searchCourierCities,
    data: courierCitySuggestions,
    isPending: isSearchingCourierCities,
  } = useMutation({
    mutationFn: (query: string) => searchCitySuggestions(query),
    onError: () => toast.error(CITY_SEARCH_ERROR),
  });

  // Подсказки улицы и дома в выбранном городе. Ошибку не показываем: без ДаData поле
  // работает как обычный ввод, а полноту адреса проверит сервер при создании заказа.
  const {
    mutate: searchAddresses,
    data: addressSuggestions,
    isPending: isSearchingAddresses,
  } = useMutation({
    mutationFn: ({ city, query }: { city: string; query: string }) =>
      searchAddressSuggestions(city, query),
  });

  // Проверка адреса тем же вердиктом, что и на сервере при создании заказа.
  const { mutateAsync: checkAddressAsync, isPending: isCheckingAddress } = useMutation({
    mutationFn: ({ city, address: value }: { city: string; address: string }) => checkAddress(city, value),
  });

  const {
    mutate: loadCityPvz,
    data: pvzPoints,
    isPending: isLoadingPvz,
  } = useMutation({
    mutationFn: (cityCode: number) => getPvzPointsByCity(cityCode),
  });

  const { mutate: calculatePvzCost, isPending: isCalculatingPvz } = useMutation({
    mutationFn: (cityCode: number) => calculateDeliveryCost({ items, type: "pvz", cityCode }),
    onSuccess: (tariff) => setPvzTariff(tariff),
    onError: (error) => {
      setPvzTariff(null);
      toast.error(errorMessage(error, "Не удалось рассчитать стоимость"));
    },
  });

  const {
    mutate: calculateCourierCost,
    mutateAsync: calculateCourierCostAsync,
    isPending: isCalculatingCourier,
  } = useMutation({
    mutationFn: (cityCode: number) => calculateDeliveryCost({ items, type: "courier", cityCode }),
    onSuccess: (tariff) => setCourierTariff(tariff),
    onError: (error) => {
      setCourierTariff(null);
      toast.error(errorMessage(error, "Не удалось рассчитать стоимость"));
    },
  });

  function selectCity(city: CdekCityMatch) {
    setSelectedCity(city);
    setCityQuery(city.city);
    setSelectedPoint(null);
    setPvzTariff(null);
    setPvzQuery("");
    loadCityPvz(city.code, {
      onError: (error) => toast.error(errorMessage(error, "Не удалось загрузить пункты выдачи")),
    });
  }

  // Живые подсказки по мере ввода — от 2 символов, независимо от полноты названия.
  useDebouncedEffect(
    () => {
      const query = cityQuery.trim();
      if (query.length >= CITY_SEARCH_MIN_CHARS) searchCities(query);
    },
    [cityQuery],
    CITY_SEARCH_DELAY_MS,
  );

  function selectCourierCity(city: CdekCityMatch) {
    setCourierCity(city);
    setCourierQuery(city.city);
    setCourierTariff(null);
  }

  useDebouncedEffect(
    () => {
      const query = courierQuery.trim();
      if (query.length >= CITY_SEARCH_MIN_CHARS) searchCourierCities(query);
    },
    [courierQuery],
    CITY_SEARCH_DELAY_MS,
  );

  useDebouncedEffect(
    () => {
      const query = address.trim();
      if (courierCity && query.length >= ADDRESS_SEARCH_MIN_CHARS) {
        searchAddresses({ city: courierCity.city, query });
      }
    },
    [address, courierCity],
    CITY_SEARCH_DELAY_MS,
  );

  // Стоимость считается сама, как только есть город и адрес: отдельная кнопка «Рассчитать»
  // была лишним шагом — сумма зависит только от города, а не от того, нажали ли её.
  useDebouncedEffect(
    () => {
      if (courierCity && address.trim()) calculateCourierCost(courierCity.code);
    },
    [address, courierCity],
    CITY_SEARCH_DELAY_MS,
  );

  function selectPvzPoint(point: Pvz) {
    if (!selectedCity) return;
    setSelectedPoint(point);
    setPvzQuery(point.address);
    setPvzTariff(null);
    calculatePvzCost(selectedCity.code);
  }

  // ПВЗ выбранного города уже загружены целиком — фильтруем локально, без похода в сеть.
  const pvzQueryNormalized = pvzQuery.trim().toLowerCase();
  const pvzMatches = pvzQueryNormalized
    ? (pvzPoints ?? []).filter((p) => p.address.toLowerCase().includes(pvzQueryNormalized))
    : (pvzPoints ?? []);
  const pvzSuggestions = pvzMatches.slice(0, 8);

  function applyPvz() {
    if (!selectedPoint || !selectedCity || !pvzTariff) return;
    onApply({
      provider: selectedPoint.provider,
      type: "pvz",
      label: `${DELIVERY_PROVIDER_LABELS[selectedPoint.provider]}, ПВЗ`,
      address: selectedPoint.address,
      cost: pvzTariff.cost,
      pvzCode: selectedPoint.code,
      city: selectedCity.city,
      cityCode: selectedCity.code,
      tariffCode: pvzTariff.tariffCode,
    });
  }

  async function applyCourier() {
    const value = address.trim();
    setCourierErrors({
      city: courierCity ? undefined : "Выберите город из подсказок",
      address: value ? undefined : "Укажите улицу и номер дома",
    });
    if (!courierCity || !value) return;

    const verdict = await checkAddressAsync({ city: courierCity.city, address: value });
    if (verdict === "no-house") {
      setCourierErrors({ address: "Укажите номер дома" });
      return;
    }
    if (verdict === "not-found") {
      setCourierErrors({ address: "Не нашли такой адрес — выберите вариант из подсказок" });
      return;
    }

    // Расчёт мог не успеть: он идёт по дебаунсу, а покупатель жмёт «Применить» сразу.
    let tariff = courierTariff;
    if (!tariff) {
      try {
        tariff = await calculateCourierCostAsync(courierCity.code);
      } catch {
        return; // ошибку уже показал onError мутации
      }
    }

    onApply({
      provider: "cdek",
      type: "courier",
      label: `${DELIVERY_PROVIDER_LABELS.cdek}, курьер`,
      // Город обязательно в самом адресе: иначе в заказе останутся «улица, дом, квартира»,
      // а по такой строке не понять, куда доставка едет.
      address: `${courierCity.city}, ${value}`,
      cost: tariff.cost,
      city: courierCity.city,
      cityCode: courierCity.code,
      tariffCode: tariff.tariffCode,
    });
  }

  return (
    <section className="relative isolate overflow-hidden sm:flex sm:min-h-[75vh] sm:items-center sm:justify-center sm:px-5 sm:py-16">
      <Backdrop />
      <div className="relative w-full bg-paper-50 p-5 sm:max-w-155 sm:rounded-card sm:bg-paper-50/95 sm:p-8 sm:shadow-[0_40px_80px_-32px_rgba(28,20,16,0.35)] sm:backdrop-blur-sm md:p-10">
        <button
          onClick={onBack}
          className="mb-6 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
        >
          <ArrowLeftIcon size={16} />
          Назад к оформлению
        </button>

        <SectionTitle className="text-[28px]">Оформление заказа</SectionTitle>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "pvz" | "courier")} className="mt-6">
          <TabsList>
            <TabsTrigger value="pvz">Пункт выдачи</TabsTrigger>
            <TabsTrigger value="courier">Курьером</TabsTrigger>
          </TabsList>

          <TabsContent value="pvz" className="mt-5 flex flex-col gap-3">
            <Combobox
              value={cityQuery}
              onValueChange={setCityQuery}
              items={citySuggestions ?? []}
              getItemKey={(c) => String(c.code)}
              getItemLabel={(c) => (c.region ? `${c.city}, ${c.region}` : c.city)}
              onSelect={selectCity}
              isLoading={isSearchingCities}
              minChars={CITY_SEARCH_MIN_CHARS}
              placeholder="Город"
            />

            <Combobox
              value={pvzQuery}
              onValueChange={setPvzQuery}
              items={pvzSuggestions}
              getItemKey={(p) => p.code}
              getItemLabel={(p) => p.address}
              onSelect={selectPvzPoint}
              isLoading={isLoadingPvz}
              minChars={0}
              disabled={!pvzPoints}
              placeholder={isLoadingPvz ? "Загружаем пункты…" : !selectedCity ? "Сначала выберите город" : "Пункт выдачи — улица, дом"}
            />

            <div>
              {pvzPoints && pvzPoints.length > 0 ? (
                <PvzMap points={pvzPoints} selectedCode={selectedPoint?.code} onSelect={selectPvzPoint} />
              ) : (
                <div className="grid aspect-[4/3] place-items-center rounded-input bg-paper-200 text-center text-sm text-ink-600">
                  {isLoadingPvz
                    ? "Загружаем пункты выдачи…"
                    : pvzPoints
                      ? "В этом городе нет пунктов выдачи СДЭК"
                      : "Выберите город"}
                </div>
              )}
            </div>

            {selectedPoint && (
              <div className="rounded-2xl border border-ink-900/12 bg-white p-4 text-[13px]">
                <p>
                  <b>Адрес:</b> {selectedPoint.address}
                </p>
                {selectedPoint.workTime && (
                  <p className="mt-1">
                    <b>Часы работы:</b> {selectedPoint.workTime}
                  </p>
                )}
                <p className="mt-1">
                  <b>Стоимость:</b>{" "}
                  {isCalculatingPvz ? "считаем…" : pvzTariff ? formatDeliveryCost(pvzTariff.cost) : "—"}
                </p>
                <button
                  type="button"
                  onClick={applyPvz}
                  disabled={!pvzTariff}
                  className="mt-3 w-full cursor-pointer rounded-full border border-ink-900/18 py-2 text-sm font-medium transition-colors hover:border-brand disabled:opacity-50"
                >
                  Забрать отсюда
                </button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="courier" className="mt-5 flex flex-col gap-4">
            {courierErrors.city && <ErrorLine>{courierErrors.city}</ErrorLine>}
            <Combobox
              value={courierQuery}
              onValueChange={(value) => {
                setCourierQuery(value);
                // Правка текста сбрасывает выбранный город: набранная руками строка — ещё
                // не город из справочника, кода СДЭК у неё нет.
                setCourierCity(null);
                setCourierTariff(null);
                setCourierErrors({});
              }}
              items={courierCitySuggestions ?? []}
              getItemKey={(c) => String(c.code)}
              getItemLabel={(c) => (c.region ? `${c.city}, ${c.region}` : c.city)}
              onSelect={selectCourierCity}
              isLoading={isSearchingCourierCities}
              minChars={CITY_SEARCH_MIN_CHARS}
              placeholder="Город"
            />
            {courierErrors.address && <ErrorLine>{courierErrors.address}</ErrorLine>}
            <Combobox
              value={address}
              onValueChange={(value) => {
                setAddress(value);
                setCourierTariff(null);
                setCourierErrors({});
              }}
              items={addressSuggestions ?? []}
              getItemKey={(a: DadataAddress) => a.full}
              getItemLabel={(a: DadataAddress) => a.value}
              onSelect={(a: DadataAddress) => {
                setAddress(a.value);
                setCourierTariff(null);
              }}
              isLoading={isSearchingAddresses}
              minChars={ADDRESS_SEARCH_MIN_CHARS}
              placeholder="Улица, дом, квартира"
              disabled={!courierCity}
            />

            {(isCalculatingCourier || courierTariff) && (
              <p className="text-[15px]">
                <b>Стоимость доставки:</b>{" "}
                {isCalculatingCourier || !courierTariff ? "считаем…" : formatDeliveryCost(courierTariff.cost)}
              </p>
            )}

            <button
              type="button"
              onClick={applyCourier}
              disabled={isCheckingAddress}
              className="w-full cursor-pointer rounded-full bg-brand py-3.5 font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
            >
              Применить
            </button>
          </TabsContent>
        </Tabs>

        <LegalLinks />
      </div>
    </section>
  );
}

/** Ошибка над полем: покупатель видит её там же, где исправляет, а не тостом поверх формы. */
function ErrorLine({ children }: { children: React.ReactNode }) {
  return <p className="-mb-2 text-sm text-brand-dark">{children}</p>;
}
