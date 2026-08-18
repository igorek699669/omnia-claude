import Image from "next/image";
import { ArrowLink } from "@/shared/ui";

const points = [
  ["Яркий и длительный звук", "Профессиональное звучание по разумной цене"],
  ["Нержавеющая сталь", "Не боится коррозии, требует минимальный уход"],
  ["Держит строй", "Стабильное звучание даже при активной игре (без фанатизма)"],
] as const;

export function Hero() {
  return (
    <section className="mx-auto max-w-[1440px] px-5 pb-16 pt-8 md:px-12 md:pb-26">
      <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
        <div>
          <h1 className="mb-6 text-balance font-display text-[clamp(44px,5vw,72px)] font-medium leading-[1.04] tracking-tight">
            Ханги, резонирующие с&nbsp;ритмом <em className="not-italic text-brand">вашей души</em>
          </h1>
          <p className="mb-10 max-w-[46ch] text-lg text-ink-600">
            Каждый инструмент настроен мастером вручную и проходит тройной контроль качества.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            {/* <ArrowLink href="/#sound">Выбрать звук</ArrowLink> временно скрыт, вернуть позже */}
            <ArrowLink href="/catalog">Каталог инструментов</ArrowLink>
          </div>
        </div>

        <div className="mx-auto w-full max-w-140 lg:max-w-none">
          <Image
            src="/images/hero/hero-handpan.png"
            alt="Ханг из нержавеющей стали"
            width={513}
            height={501}
            priority
            className="aspect-square w-full rounded-full object-cover shadow-[0_40px_80px_-32px_rgba(28,20,16,0.45)]"
          />
        </div>
      </div>

      <div className="mt-14 flex flex-col gap-3 sm:flex-row">
        {points.map(([title, text]) => (
          <div key={title} className="relative min-w-0 rounded-2xl bg-white py-4 pl-9 pr-5 sm:flex-1">
            <span className="absolute left-5 top-5.5 size-1.75 rounded-full bg-brand" />
            <strong className="block font-display text-[15px] font-medium">{title}</strong>
            <p className="text-[13px] leading-snug text-ink-600">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
