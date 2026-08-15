import { HandpanArt } from "@/shared/ui";
// import { ArrowLink } from "@/shared/ui"; // временно не используется — вернуть вместе со ссылкой на /#sound
import Link from "next/link";

const points = [
  ["Сустейн", "Глубокое и чистое звучание"],
  ["Нержавеющая сталь", "Не боится коррозии, минимальный уход"],
  ["Тонкая настройка", "Держит строй даже при активной игре (без фанатизма)"],
] as const;

export function Hero() {
  return (
    <section className="mx-auto max-w-[1440px] px-5 pb-16 pt-8 md:px-12 md:pb-26">
      <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
        <div>
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-7 sm:gap-y-4">
            {points.map(([title, text]) => (
              <div key={title} className="relative min-w-0 pl-4 sm:flex-1 sm:basis-40">
                <span className="absolute left-0 top-1.5 size-[7px] rounded-full bg-brand" />
                <strong className="block font-display text-[15px] font-medium">{title}</strong>
                <p className="text-[13px] leading-snug text-ink-600">{text}</p>
              </div>
            ))}
          </div>

          <h1 className="mb-6 text-balance font-display text-[clamp(44px,5vw,72px)] font-medium leading-[1.04] tracking-tight">
            Ханги, резонирующие с&nbsp;ритмом <em className="not-italic text-brand">вашей души</em>
          </h1>
          <p className="mb-10 max-w-[46ch] text-lg text-ink-600">
            Подбираем инструмент под ваш слух и практику — от первого прослушивания до
            бережной доставки до двери. Каждый ханг настроен вручную и звучит в три раза
            дольше аналогов.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            {/* <ArrowLink href="/#sound">Выбрать звук</ArrowLink> временно скрыт, вернуть позже */}
            <Link
              href="/catalog"
              className="border-b border-ink-900/25 py-3.5 text-base font-medium transition-colors hover:border-brand hover:text-brand-dark"
            >
              Каталог инструментов
            </Link>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[560px] lg:max-w-none">
          <HandpanArt className="aspect-square w-full rounded-full shadow-[0_40px_80px_-32px_rgba(28,20,16,0.45)]" />
        </div>
      </div>
    </section>
  );
}
