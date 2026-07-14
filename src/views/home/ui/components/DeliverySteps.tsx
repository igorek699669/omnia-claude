"use client";

import { useState } from "react";
import { SectionTitle } from "@/shared/ui";

const steps = [
  {
    title: "Бережно собираем",
    text: "Кладём инструмент в закрытый твёрдый кофр — он входит в стоимость.",
    caption: "Инструмент укладывается в жёсткий кофр",
    bg: "radial-gradient(circle at 40% 35%, #4a3a2c 0%, #2c211a 60%, #191009 100%)",
  },
  {
    title: "Надёжно упаковываем",
    text: "Дополнительный слой защиты: плотный короб и амортизация по контуру.",
    caption: "Короб и амортизация по контуру",
    bg: "radial-gradient(circle at 55% 40%, #8a6f4d 0%, #5c4630 55%, #332416 100%)",
  },
  {
    title: "Отправляем удобным для вас способом",
    text: "СДЭК до двери или пункта выдачи. Трек-номер и статус — в личном кабинете.",
    caption: "Передача в СДЭК: трек-номер — в личном кабинете",
    bg: "linear-gradient(160deg, #3a2d21 0%, #191009 70%)",
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
                  className={`grid w-full cursor-default grid-cols-[auto_1fr] gap-5 text-left transition-opacity lg:cursor-pointer ${
                    i === active ? "" : "lg:opacity-55 lg:hover:opacity-100"
                  }`}
                >
                  <span
                    className={`grid size-10 place-items-center rounded-full border font-display text-[15px] font-medium transition-colors ${
                      i === active ? "border-brand bg-brand" : "border-paper-50/30"
                    }`}
                  >
                    0{i + 1}
                  </span>
                  <span>
                    <strong className="mb-1 block font-display text-xl font-medium">{step.title}</strong>
                    <span className="block text-sm text-paper-50/65">{step.text}</span>
                  </span>
                </button>
                <div
                  className="relative mt-3.5 aspect-[16/10] overflow-hidden rounded-2xl lg:hidden"
                  style={{ background: step.bg }}
                >
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
              style={{ background: step.bg }}
            >
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
