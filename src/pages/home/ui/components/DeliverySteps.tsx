"use client";

import { useState } from "react";
import Image from "next/image";
import { SectionTitle } from "@/shared/ui";

/** Одно и то же фото показывается в узком мобильном блоке и в широком десктопном — отсюда две ширины. */
const STEP_IMAGE_SIZES = "(min-width: 1024px) 45vw, 100vw";

const steps = [
  {
    title: "Бережно собираем",
    text: "Убираем инструмент в защитный тканевый чехол.",
    caption: "Инструмент в защитном чехле",
    image: "/images/delivery/cover.jpg",
  },
  {
    title: "Надёжно упаковываем",
    text: "Дополнительный слой защиты: пенопластовый ложемент внутри плотного короба.",
    caption: "Уложен в короб с пенопластовым ложементом",
    image: "/images/delivery/packed.jpg",
  },
  {
    title: "Отправляем удобным для вас способом",
    text: "СДЭК до двери или пункта выдачи. Трек-номер и статус — в личном кабинете.",
    caption: "Короб готов к передаче в СДЭК",
    image: "/images/delivery/box.jpg",
  },
];

export function DeliverySteps() {
  const [active, setActive] = useState(0);

  return (
    <section id="delivery-info" className="mx-auto max-w-[1440px] px-5 py-24 md:px-12">
      <div className="grid items-center gap-10 rounded-card bg-ink-900 p-8 text-paper-50 md:p-12 lg:grid-cols-2 lg:gap-16 lg:p-16">
        <div>
          <SectionTitle className="mb-10 text-paper-50">
            Как происходит доставка вашего инструмента
          </SectionTitle>
          <div className="flex flex-col">
            {steps.map((step, i) => (
              <div key={step.title} className="border-b border-paper-50/14 py-5 last:border-none">
                {/* Десктоп: кликабельный шаг; мобилка: статичный блок с картинкой */}
                <button
                  onClick={() => setActive(i)}
                  className={`grid w-full cursor-default grid-cols-[auto_1fr] gap-5 text-left transition-opacity lg:cursor-pointer ${i === active ? "" : "lg:opacity-55 lg:hover:opacity-100"
                    }`}
                >
                  <span
                    className={`grid size-10 place-items-center rounded-full border font-display text-[15px] font-medium transition-colors ${i === active ? "border-brand bg-brand" : "border-paper-50/30"
                      }`}
                  >
                    0{i + 1}
                  </span>
                  <span>
                    <strong className="mb-1 block font-display text-xl font-medium">{step.title}</strong>
                    <span className="block text-sm text-paper-50/65">{step.text}</span>
                  </span>
                </button>
                <div className="relative mt-3.5 aspect-[16/10] overflow-hidden rounded-2xl bg-[#191009] lg:hidden">
                  <Image src={step.image} alt={step.caption} fill sizes={STEP_IMAGE_SIZES} className="object-cover" />
                  <Caption>{step.caption}</Caption>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative hidden aspect-[4/3] overflow-hidden rounded-[28px] bg-[#191009] lg:block">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className={`absolute inset-0 transition-opacity duration-450 ${i === active ? "opacity-100" : "opacity-0"}`}
            >
              <Image src={step.image} alt={step.caption} fill sizes={STEP_IMAGE_SIZES} className="object-cover" />
              <Caption>{step.caption}</Caption>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute bottom-4 left-4 w-fit max-w-[calc(100%-2rem)] rounded-full bg-ink-900/55 px-4 py-2 text-[13px] text-paper-50/80 backdrop-blur-sm">
      {children}
    </span>
  );
}
