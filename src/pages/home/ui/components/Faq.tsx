import Image from "next/image";
import { Tag, SectionTitle, Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/shared/ui";

const faq = [
  ["Какой срок службы инструмента?", "При аккуратном обращении ханг из нержавеющей стали служит десятилетиями. Мы даём гарантию на строй и покрытие — если что-то пойдёт не так, перенастроим."],
  ["Самые уязвимые места у ханга?", "Купол динга и края тоновых полей. Не ставьте инструмент на ребро без чехла и не играйте палочками — только руками."],
  ["Как ухаживать за хангом?", "Протирайте микрофиброй после игры и храните в чехле. Нержавеющая сталь не требует масла — достаточно беречь от ударов."],
  ["Можно ли играть в холодную или жаркую погоду?", "Можно. Резкие перепады температуры кратковременно влияют на высоту нот, но строй возвращается при комнатной температуре."],
] as const;

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 py-24 md:px-12">
      <div className="grid items-start gap-14 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        {/* Квадрат, а не 4/5: исходник широкий (1250x740), и при вертикальном боксе в кадр попадала
            бы лишь половина ширины, растянутая на всю высоту, — фото заметно мылило. */}
        <div className="relative mx-auto aspect-square w-full max-w-[520px] overflow-hidden rounded-card bg-ink-900 lg:sticky lg:top-28">
          {/* Кадрируем левее середины (38%): в вырез попадают экран тюнера и инструмент, срезается правый край.
              sizes считаем по реальной ширине отрисованного фото (бокс / доля видимой части ≈ 520 / 0.59),
              иначе next/image отдал бы вариант 1080px и растянул его. */}
          <Image
            src="/images/faq/tuning.webp"
            alt="Настройка ханга в мастерской: мастер снимает спектр ноты по экрану тюнера"
            fill
            sizes="(min-width: 1024px) 900px, 170vw"
            className="object-cover object-[38%_50%]"
          />
        </div>
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
