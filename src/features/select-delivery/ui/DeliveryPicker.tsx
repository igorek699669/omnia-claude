"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { SectionTitle, Tabs, TabsList, TabsTrigger, TabsContent, Backdrop, LegalLinks } from "@/shared/ui";
import { formatPrice, DELIVERY_PROVIDER_LABELS } from "@/shared/lib";
import { getPvzPoints, calculateDeliveryCost } from "../api/actions";
import { PvzMap } from "./PvzMap";
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
  const [city, setCity] = useState("Москва");

  const [selectedPoint, setSelectedPoint] = useState<Pvz | null>(null);
  const [pvzCost, setPvzCost] = useState<number | null>(null);

  const [address, setAddress] = useState("");
  const [courierCost, setCourierCost] = useState<number | null>(null);

  const {
    mutate: findPvzPoints,
    isPending: isFindingPvz,
    data: pvzPoints,
  } = useMutation({
    mutationFn: () => getPvzPoints(city),
    onError: (error) => toast.error(errorMessage(error, "Не удалось загрузить пункты выдачи")),
  });

  // Карту показываем сразу, по городу по умолчанию — не дожидаясь клика на «Найти».
  useEffect(() => {
    findPvzPoints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { mutate: calculatePvzCost, isPending: isCalculatingPvz } = useMutation({
    mutationFn: () => calculateDeliveryCost({ items, type: "pvz", city }),
    onSuccess: (cost) => setPvzCost(cost),
    onError: (error) => {
      setPvzCost(null);
      toast.error(errorMessage(error, "Не удалось рассчитать стоимость"));
    },
  });

  const { mutate: calculateCourierCost, isPending: isCalculatingCourier } = useMutation({
    mutationFn: () => calculateDeliveryCost({ items, type: "courier", city }),
    onSuccess: (cost) => setCourierCost(cost),
    onError: (error) => {
      setCourierCost(null);
      toast.error(errorMessage(error, "Не удалось рассчитать стоимость"));
    },
  });

  function selectPoint(point: Pvz) {
    setSelectedPoint(point);
    setPvzCost(null);
    calculatePvzCost();
  }

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
    <section className="relative isolate flex min-h-[75vh] items-center justify-center overflow-hidden px-5 py-16">
      <Backdrop />
      <div className="relative w-full max-w-[620px] rounded-card bg-paper-50/95 p-8 shadow-[0_40px_80px_-32px_rgba(28,20,16,0.35)] backdrop-blur-sm md:p-10">
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

          <TabsContent value="pvz" className="mt-5">
            <div className="flex items-center gap-3 rounded-input border border-ink-900/18 bg-white px-5 py-3.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-ink-600" aria-hidden>
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    findPvzPoints();
                  }
                }}
                className="w-full min-w-0 flex-1 bg-transparent text-base outline-none"
                placeholder="Город"
              />
              <button
                type="button"
                onClick={() => findPvzPoints()}
                disabled={isFindingPvz}
                className="shrink-0 cursor-pointer rounded-full bg-paper-100 px-4 py-2 text-sm font-medium transition-colors hover:bg-paper-200 disabled:opacity-50"
              >
                {isFindingPvz ? "Ищем…" : "Найти"}
              </button>
            </div>

            <div className="mt-5">
              {pvzPoints ? (
                <PvzMap points={pvzPoints} onSelect={selectPoint} />
              ) : (
                <div className="grid aspect-[4/3] place-items-center rounded-input bg-paper-200 text-center text-sm text-ink-600">
                  {isFindingPvz ? "Загружаем пункты выдачи…" : "Введите город и нажмите «Найти»"}
                </div>
              )}
            </div>

            {selectedPoint && (
              <div className="mt-5 rounded-2xl border border-ink-900/12 bg-white p-4 text-[13px]">
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
            <div className="flex items-center gap-3 rounded-input border border-ink-900/18 bg-white px-5 py-3.5">
              <input
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setCourierCost(null);
                }}
                className="w-full min-w-0 flex-1 bg-transparent text-base outline-none"
                placeholder="Город"
              />
            </div>
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
              disabled={!address || !city || isCalculatingCourier}
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
