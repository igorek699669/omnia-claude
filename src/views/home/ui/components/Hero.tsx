import { ArrowLink } from "@/shared/ui";
import { HandpanArt } from "@/shared/assets";
import Link from "next/link";

const points = [
  ["Долговечность", "Звучание нот в 3 раза дольше, чем у аналогов"],
  ["Нержавеющая сталь", "Не боится коррозии и не требует масел"],
  ["Ручная настройка", "Держит строй даже при активной игре"],
] as const;

export function Hero() {
  return (
    <section className="mx-auto max-w-[1440px] overflow-hidden px-5 pb-16 pt-8 md:px-12 md:pb-26">
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
            <ArrowLink href="/#sound">Выбрать звук</ArrowLink>
            <Link
              href="/catalog"
              className="border-b border-ink-900/25 py-3.5 text-base font-medium transition-colors hover:border-brand hover:text-brand-dark"
            >
              Каталог инструментов
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[560px] lg:max-w-none">
          <div aria-hidden className="pointer-events-none absolute inset-0 m-auto aspect-square w-full max-w-[640px]">
            <span className="ring-breathe absolute inset-0 m-auto h-[105%] w-[105%] rounded-full border border-brand/35" />
            <span className="ring-breathe absolute inset-0 m-auto h-[118%] w-[118%] rounded-full border border-brand/35 opacity-60 [animation-delay:1.2s]" />
            <span className="ring-breathe absolute inset-0 m-auto h-[132%] w-[132%] rounded-full border border-brand/35 opacity-35 [animation-delay:2.4s]" />
          </div>
          <HandpanArt className="relative z-10 aspect-square w-full rounded-full shadow-[0_40px_80px_-32px_rgba(28,20,16,0.45)]" />
          <div className="absolute bottom-[6%] right-[4%] z-20 flex items-center gap-3 rounded-full bg-white py-3 pl-3.5 pr-5.5 shadow-[0_16px_40px_-16px_rgba(28,20,16,0.35)]">
            <button
              aria-label="Послушать звучание"
              className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-brand text-white transition-colors hover:bg-brand-dark"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </button>
            <div className="leading-tight">
              <strong className="block text-[15px] font-semibold">Послушать звучание</strong>
              <small className="text-[13px] text-ink-600">Танцующие волны · D Kurd</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
