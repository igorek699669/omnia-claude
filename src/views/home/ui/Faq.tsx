import { Tag, SectionTitle } from "@/shared/ui";

const faq = [
  ["Какой срок службы инструмента?", "При аккуратном обращении ханг из нержавеющей стали служит десятилетиями. Мы даём гарантию на строй и покрытие — если что-то пойдёт не так, перенастроим."],
  ["Самые уязвимые места у ханга?", "Купол динга и края тоновых полей. Не ставьте инструмент на ребро без чехла и не играйте палочками — только руками."],
  ["Как ухаживать за хангом?", "Протирайте микрофиброй после игры и храните в кофре. Нержавеющая сталь не требует масла — достаточно беречь от ударов."],
  ["Можно ли играть в холодную или жаркую погоду?", "Можно. Резкие перепады температуры кратковременно влияют на высоту нот, но строй возвращается при комнатной температуре."],
] as const;

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 py-24 md:px-12">
      <div className="grid items-start gap-14 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        <div
          className="mx-auto aspect-[4/5] w-full max-w-[520px] rounded-card lg:sticky lg:top-28"
          style={{ background: "radial-gradient(circle at 45% 30%, #cbc2b4 0%, #8f8272 45%, #4e4232 100%)" }}
          role="img"
          aria-label="Игра на ханге в мастерской"
        />
        <div>
          <Tag>FAQ</Tag>
          <SectionTitle className="mb-6 mt-5">Часто задаваемые вопросы</SectionTitle>
          {faq.map(([q, a], i) => (
            <details key={q} open={i === 0} className="group border-b border-ink-900/12">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 font-display text-[21px] font-medium [&::-webkit-details-marker]:hidden">
                {q}
                <span className="grid size-10 shrink-0 place-items-center rounded-full border border-ink-900/20 transition-transform group-open:rotate-45">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </summary>
              <p className="pb-6 pr-0 text-[15px] text-ink-600 lg:pr-16">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
