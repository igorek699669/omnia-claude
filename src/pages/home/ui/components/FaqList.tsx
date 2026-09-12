import Link from "next/link";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/shared/ui";
import type { FaqEntry } from "../../model/faq-content";

/**
 * Список вопросов с ответами — общий для блока с видео и для FAQ о заказе. В каждом списке
 * открыт ровно один ответ, первый раскрыт сразу: пустой аккордеон выглядит как нерабочий.
 *
 * Ответы лежат в разметке всегда, даже закрытые (forceMount в AccordionContent) — это
 * условие того, чтобы поисковик их видел, и заодно того, чтобы текст был доступен без JS.
 */
export function FaqList({
  items,
  idPrefix,
  className = "",
}: {
  items: FaqEntry[];
  /** Приставка к id вопроса: «q-» у образовательных, «order-» у организационных. */
  idPrefix: string;
  className?: string;
}) {
  return (
    <Accordion type="single" collapsible defaultValue={items[0]?.id} className={className}>
      {items.map((item) => (
        <AccordionItem key={item.id} value={item.id} id={`${idPrefix}${item.id}`}>
          <AccordionTrigger>{item.q}</AccordionTrigger>
          <AccordionContent>
            <p className="max-w-[65ch] leading-[1.65]">{item.a}</p>
            {item.link && <AnswerLink {...item.link} />}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

/**
 * Ссылка под ответом. Стрелка — часть оформления, а не названия: скринридер должен прочитать
 * «Открыть каталог», а не «Открыть каталог со стрелкой вверх вправо».
 */
function AnswerLink({ text, href }: { text: string; href: string }) {
  const external = href.startsWith("http");
  const className =
    "mt-3 inline-flex items-center gap-1.5 text-[15px] font-medium text-brand-link underline underline-offset-4 transition-colors hover:text-brand-dark";
  const content = (
    <>
      {text}
      <span aria-hidden>↗</span>
    </>
  );

  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  ) : (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
