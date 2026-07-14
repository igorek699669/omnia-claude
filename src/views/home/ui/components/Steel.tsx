import { Tag, SectionTitle } from "@/shared/ui";
import { HandpanArt } from "@/shared/assets";

const left = [
  ["Не подвержен коррозии", "Не требует обработки антикоррозийными маслами — переживёт репетиции у моря и игру под открытым небом."],
  ["В 3 раза дольше звучание", "По сравнению с нитрированными видами стали нота тянется дольше и затухает мягче."],
] as const;

const right = [
  ["Насыщенный обертонный звук", "Не дребезжит в сравнении с аналогами — при аккуратной игре обертона раскрываются полностью."],
  ["Не расстраивается при активной игре", "В 3 раза меньше жалоб на строй по сравнению с инструментами из обычной стали."],
] as const;

export function Steel() {
  return (
    <section id="craft" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 py-24 md:px-12">
      <div className="text-center">
        <Tag>Надёжность</Tag>
        <SectionTitle className="mt-5">Используем только нержавеющую сталь</SectionTitle>
      </div>
      <div className="mt-16 grid items-center justify-items-center gap-10 lg:grid-cols-[1fr_auto_1fr] lg:gap-12">
        <div className="flex flex-col gap-12">
          {left.map(([title, text]) => (
            <Feature key={title} title={title} text={text} />
          ))}
        </div>
        <HandpanArt className="w-[min(420px,70vw)] drop-shadow-[0_32px_48px_rgba(28,20,16,0.3)] lg:w-[min(420px,34vw)]" />
        <div className="flex flex-col gap-12">
          {right.map(([title, text]) => (
            <Feature key={title} title={title} text={text} align="right" />
          ))}
        </div>
      </div>
    </section>
  );
}

function Feature({ title, text, align }: { title: string; text: string; align?: "right" }) {
  const alignRight = align === "right" ? "lg:ml-auto lg:text-right" : "";
  const dotRight = align === "right" ? "lg:flex-row-reverse" : "";
  return (
    <div className={`max-w-80 ${alignRight}`}>
      <h3 className={`mb-2 flex items-center gap-3 font-display text-xl font-medium ${dotRight}`}>
        <span className="size-2.5 shrink-0 rounded-full bg-brand" />
        {title}
      </h3>
      <p className="text-[15px] text-ink-600">{text}</p>
    </div>
  );
}
