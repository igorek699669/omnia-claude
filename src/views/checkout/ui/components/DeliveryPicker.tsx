"use client";

import { useState } from "react";
import { SectionTitle, Tabs, TabsList, TabsTrigger } from "@/shared/ui";
import { formatPrice } from "@/shared/lib";
import { Backdrop } from "./Backdrop";
import { LegalLinks } from "./LegalLinks";

export interface Delivery {
  method: "cdek" | "post" | "boxberry";
  label: string;
  address: string;
  cost: number;
}

const METHODS = [
  { key: "cdek", label: "СДЭК", cost: 1300 },
  { key: "post", label: "Почта России", cost: null },
  { key: "boxberry", label: "Boxberry", cost: null },
] as const;

const PICKUP_POINT = {
  address: "123432, Волгоградский просп., 106, корп. 1, Москва",
  hours: "пн-вс: 09:00-20:00",
  phone: "+7 980 234 34 45",
};

export function DeliveryPicker({
  onApply,
  onBack,
}: {
  onApply: (delivery: Delivery) => void;
  onBack: () => void;
}) {
  const [method, setMethod] = useState<(typeof METHODS)[number]["key"]>("cdek");
  const [city, setCity] = useState("Москва");
  const active = METHODS.find((m) => m.key === method)!;

  function apply() {
    onApply({
      method,
      label: active.label,
      address: PICKUP_POINT.address,
      cost: active.cost ?? 0,
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

        <Tabs value={method} onValueChange={(v) => setMethod(v as (typeof METHODS)[number]["key"])} className="mt-6">
          <TabsList>
            {METHODS.map((m) => (
              <TabsTrigger key={m.key} value={m.key}>
                {m.label}
                {method === m.key && m.cost != null ? ` ${formatPrice(m.cost)}` : ""}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="mt-5 flex items-center gap-3 rounded-input border border-ink-900/18 bg-white px-5 py-3.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-ink-600" aria-hidden>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full min-w-0 flex-1 bg-transparent text-base outline-none"
            placeholder="Город"
          />
        </div>

        {/* TODO: реальная карта и список ПВЗ через СДЭК API v2 — см. CLAUDE.md Roadmap */}
        <div className="relative mt-5 aspect-[4/3] overflow-hidden rounded-input bg-paper-200">
          <MapMock />
          <div className="absolute left-1/2 top-[38%] w-[min(280px,80%)] -translate-x-1/2 -translate-y-full rounded-2xl bg-white p-4 text-[13px] shadow-[0_16px_40px_-16px_rgba(28,20,16,0.35)]">
            <p><b>Адрес:</b> {PICKUP_POINT.address}</p>
            <p className="mt-1"><b>Часы работы:</b> {PICKUP_POINT.hours}</p>
            <p className="mt-1"><b>Контакты:</b> {PICKUP_POINT.phone}</p>
            <button
              type="button"
              onClick={apply}
              className="mt-3 w-full cursor-pointer rounded-full border border-ink-900/18 py-2 text-sm font-medium transition-colors hover:border-brand"
            >
              Забрать отсюда
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={apply}
          className="mt-5 w-full cursor-pointer rounded-full bg-brand py-3.5 font-medium text-white transition-colors hover:bg-brand-dark"
        >
          Применить
        </button>

        <LegalLinks />
      </div>
    </section>
  );
}

function MapMock() {
  return (
    <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" aria-hidden>
      <rect width="400" height="300" fill="#E7E1D8" />
      <g stroke="#D8CFC2" strokeWidth="2">
        <path d="M0 60 H400" />
        <path d="M0 140 H400" />
        <path d="M0 220 H400" />
        <path d="M90 0 V300" />
        <path d="M200 0 V300" />
        <path d="M310 0 V300" />
      </g>
      <g fill="#A98F76">
        <circle cx="90" cy="60" r="5" />
        <circle cx="310" cy="140" r="5" />
        <circle cx="140" cy="220" r="5" />
        <circle cx="330" cy="240" r="5" />
      </g>
      <circle cx="200" cy="113" r="10" fill="#FF5900" stroke="white" strokeWidth="3" />
    </svg>
  );
}
