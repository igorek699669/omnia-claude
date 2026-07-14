"use client";

import { useState } from "react";
import { Tag, SectionTitle, ArrowButton } from "@/shared/ui";
import { HandpanArt } from "@/shared/assets";

const dings = ["D3", "C#3", "E3", "F3", "G3", "A3"];
const notes = ["A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4"];

export function SoundPicker() {
  const [ding, setDing] = useState("D3");

  return (
    <section id="sound" className="scroll-mt-24 px-3 md:px-6">
      <div className="rounded-card bg-paper-100">
        <div className="mx-auto grid max-w-[1440px] items-center gap-14 px-5 py-24 md:px-12 lg:grid-cols-2">
          <div>
            <Tag>Протестируйте звучание</Tag>
            <SectionTitle className="mt-5">Выберите звук, который подходит именно вам</SectionTitle>

            <div className="mt-8 flex flex-col gap-6">
              <div>
                <label className="mb-2 block text-[13px] font-semibold uppercase tracking-wider text-ink-600">
                  Нота динга
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {dings.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDing(d)}
                      className={`cursor-pointer rounded-full border px-5 py-2.5 text-[15px] font-medium transition-colors ${
                        d === ding
                          ? "border-ink-900 bg-ink-900 text-paper-50"
                          : "border-ink-900/18 hover:border-brand"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <Select label="Строй" options={["D Kurd — мягкий, медитативный", "Celtic Minor — кельтский минор", "Hijaz — восточный колорит", "Amara — светлый, воздушный"]} />
              <Select label="Количество нот" options={["9 нот", "10 нот", "12 нот", "14 нот"]} />

              <div>
                <ArrowButton>Заказать этот звук</ArrowButton>
                <p className="mt-3 max-w-[40ch] text-sm text-ink-600">
                  Нажмите на ноту на схеме, чтобы услышать её звучание. Соберём инструмент
                  под выбранный строй.
                </p>
              </div>
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[560px]">
            <HandpanArt className="h-full w-full" />
            {/* TODO: интерактивные ноты со звуком (Web Audio API) — см. CLAUDE.md */}
            <svg viewBox="0 0 200 200" className="absolute inset-0" aria-hidden>
              <g fontSize="9" fontWeight="500" fill="#F6F4F1" textAnchor="middle" fontFamily="var(--font-jost)">
                <text x="100" y="103">{ding}</text>
                {notes.map((n, i) => {
                  const angle = (i / notes.length) * 2 * Math.PI - Math.PI / 2;
                  const x = 100 + 66 * Math.cos(angle);
                  const y = 103 + 66 * Math.sin(angle);
                  return <text key={n} x={x} y={y}>{n}</text>;
                })}
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

function Select({ label, options }: { label: string; options: string[] }) {
  return (
    <div>
      <label className="mb-2 block text-[13px] font-semibold uppercase tracking-wider text-ink-600">
        {label}
      </label>
      <select className="w-full max-w-[360px] cursor-pointer appearance-none rounded-input border border-ink-900/18 bg-white px-5 py-3.5 text-base">
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
