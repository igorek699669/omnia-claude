import { Tag, SectionTitle, Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/shared/ui";

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
          <Accordion type="multiple" defaultValue={[faq[0][0]]}>
            {faq.map(([q, a]) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger>{q}</AccordionTrigger>
                <AccordionContent>{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
