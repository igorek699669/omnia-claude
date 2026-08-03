"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { SectionTitle, Tabs, TabsList, TabsTrigger, TabsContent, Backdrop, LegalLinks, Combobox } from "@/shared/ui";
import { formatPrice, DELIVERY_PROVIDER_LABELS } from "@/shared/lib";
import type { CdekCityMatch } from "@/shared/lib";
import { searchCitySuggestions, getPvzPointsByCity, calculateDeliveryCost } from "../api/actions";
import { PvzMap } from "./PvzMap";
import { CITY_SEARCH_MIN_CHARS } from "../model/types";
import type { Delivery, Pvz } from "../model/types";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

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
  const [pvzCost, setPvzCost] = useState<number | null>(null);

  const [courierCity, setCourierCity] = useState("");
  const [address, setAddress] = useState("");
  const [courierCost, setCourierCost] = useState<number | null>(null);

  // Подсказки городов: справочник СДЭК тянется и фильтруется на сервере (см. actions.ts
  // searchCitySuggestions) — оттуда сразу приходит настоящий code, резолвить его отдельно не нужно.
  const {
    mutate: searchCities,
    data: citySuggestions,
    isPending: isSearchingCities,
  } = useMutation({
    mutationFn: (query: string) => searchCitySuggestions(query),
  });

  // Отдельная мутация для вкладки «Курьером» — тот же источник, но своё состояние
  // подсказок, чтобы не путать его с поиском города для ПВЗ.
  const {
    mutate: searchCourierCities,
    data: courierCitySuggestions,
    isPending: isSearchingCourierCities,
  } = useMutation({
    mutationFn: (query: string) => searchCitySuggestions(query),
  });

  const {
    mutate: loadCityPvz,
    data: pvzPoints,
    isPending: isLoadingPvz,
  } = useMutation({
    mutationFn: (cityCode: number) => getPvzPointsByCity(cityCode),
  });

  const { mutate: calculatePvzCost, isPending: isCalculatingPvz } = useMutation({
    mutationFn: (cityForCalc: string) => calculateDeliveryCost({ items, type: "pvz", city: cityForCalc }),
    onSuccess: (cost) => setPvzCost(cost),
    onError: (error) => {
      setPvzCost(null);
      toast.error(errorMessage(error, "Не удалось рассчитать стоимость"));
    },
  });

  const { mutate: calculateCourierCost, isPending: isCalculatingCourier } = useMutation({
    mutationFn: () => calculateDeliveryCost({ items, type: "courier", city: courierCity }),
    onSuccess: (cost) => setCourierCost(cost),
    onError: (error) => {
      setCourierCost(null);
      toast.error(errorMessage(error, "Не удалось рассчитать стоимость"));
    },
  });

  function selectCity(city: CdekCityMatch) {
    setSelectedCity(city);
    setCityQuery(city.city);
    setSelectedPoint(null);
    setPvzCost(null);
    setPvzQuery("");
    loadCityPvz(city.code, {
      onError: (error) => toast.error(errorMessage(error, "Не удалось загрузить пункты выдачи")),
    });
  }

  // Живые подсказки городов по мере ввода — от 2 символов, независимо от того, дописан
  // ли город целиком (см. actions.ts searchCitySuggestions).
  useEffect(() => {
    const query = cityQuery.trim();
    if (query.length < CITY_SEARCH_MIN_CHARS) return;
    const timer = setTimeout(() => searchCities(query), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityQuery]);

  function selectCourierCity(city: CdekCityMatch) {
    setCourierCity(city.city);
    setCourierCost(null);
  }

  useEffect(() => {
    const query = courierCity.trim();
    if (query.length < CITY_SEARCH_MIN_CHARS) return;
    const timer = setTimeout(() => searchCourierCities(query), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courierCity]);

  function selectPvzPoint(point: Pvz) {
    setSelectedPoint(point);
    setPvzQuery(point.address);
    setPvzCost(null);
    calculatePvzCost(point.city);
  }

  // ПВЗ выбранного города уже загружены целиком — фильтруем локально, без похода в сеть.
  const pvzQueryNormalized = pvzQuery.trim().toLowerCase();
  const pvzMatches = pvzQueryNormalized
    ? (pvzPoints ?? []).filter((p) => p.address.toLowerCase().includes(pvzQueryNormalized))
    : (pvzPoints ?? []);
  const pvzSuggestions = pvzMatches.slice(0, 8);

  function applyPvz() {
    if (!selectedPoint || pvzCost === null) return;
    onApply({
      provider: selectedPoint.provider,
      type: "pvz",
      label: `${DELIVERY_PROVIDER_LABELS[selectedPoint.provider]}, ПВЗ`,
      address: selectedPoint.address,
      cost: pvzCost,
      pvzCode: selectedPoint.code,
    });
  }

  function applyCourier() {
    if (courierCost === null) return;
    onApply({
      provider: "cdek",
      type: "courier",
      label: `${DELIVERY_PROVIDER_LABELS.cdek}, курьер`,
      address,
      cost: courierCost,
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
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
                  {isCalculatingPvz ? "считаем…" : pvzCost !== null ? formatPrice(pvzCost) : "—"}
                </p>
                <button
                  type="button"
                  onClick={applyPvz}
                  disabled={pvzCost === null}
                  className="mt-3 w-full cursor-pointer rounded-full border border-ink-900/18 py-2 text-sm font-medium transition-colors hover:border-brand disabled:opacity-50"
                >
                  Забрать отсюда
                </button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="courier" className="mt-5 flex flex-col gap-4">
            <Combobox
              value={courierCity}
              onValueChange={(value) => {
                setCourierCity(value);
                setCourierCost(null);
              }}
              items={courierCitySuggestions ?? []}
              getItemKey={(c) => String(c.code)}
              getItemLabel={(c) => (c.region ? `${c.city}, ${c.region}` : c.city)}
              onSelect={selectCourierCity}
              isLoading={isSearchingCourierCities}
              minChars={CITY_SEARCH_MIN_CHARS}
              placeholder="Город"
            />
            <div className="flex items-center gap-3 rounded-input border border-ink-900/18 bg-white px-5 py-3.5">
              <input
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setCourierCost(null);
                }}
                className="w-full min-w-0 flex-1 bg-transparent text-base outline-none"
                placeholder="Улица, дом, квартира"
              />
            </div>

            <button
              type="button"
              onClick={() => calculateCourierCost()}
              disabled={!address || !courierCity || isCalculatingCourier}
              className="w-full cursor-pointer rounded-full bg-paper-100 py-3 text-sm font-medium transition-colors hover:bg-paper-200 disabled:opacity-50"
            >
              {isCalculatingCourier ? "Считаем…" : "Рассчитать стоимость"}
            </button>

            {courierCost !== null && (
              <p className="text-[15px]">
                <b>Стоимость доставки:</b> {formatPrice(courierCost)}
              </p>
            )}

            <button
              type="button"
              onClick={applyCourier}
              disabled={courierCost === null}
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
