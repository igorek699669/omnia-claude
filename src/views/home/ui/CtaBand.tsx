import { SectionTitle, ArrowButton } from "@/shared/ui";

export function CtaBand() {
  return (
    <section className="mx-auto max-w-[1440px] px-5 md:px-12">
      <div className="flex flex-col items-center gap-7 rounded-card bg-paper-200 px-6 py-14 text-center md:px-16 md:py-20">
        <SectionTitle>Остались вопросы?</SectionTitle>
        <p className="max-w-[52ch] text-[17px] text-ink-600">
          Поможем выбрать строй, расскажем про уход и подберём инструмент под вашу практику —
          без спешки и навязывания.
        </p>
        <ArrowButton>Задать вопрос</ArrowButton>
      </div>
    </section>
  );
}
