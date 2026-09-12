import Image from "next/image";
import { ORDER_FAQ, faqPageJsonLd } from "../../model/faq-content";
import { FaqList } from "./FaqList";

/**
 * Вопросы о заказе, доставке и возврате — последний блок перед подвалом.
 *
 * Видимого заголовка и плашки нет сознательно: выше стоит «Остались вопросы?», и второй
 * заголовок подряд только повторял бы его. Имя секции для скринридера задано aria-label.
 *
 * Разметка FAQPage выводится здесь одна на всю страницу и охватывает все 24 ответа — и
 * восемь здешних, и шестнадцать из блока с видео. Собирается из тех же данных, что и
 * видимый текст: ответ, которого нет на странице, поисковик считает обманом.
 */
export function Faq() {
  return (
    <section
      id="faq"
      aria-label="Вопросы о заказе и доставке"
      className="mx-auto max-w-[1440px] scroll-mt-24 px-5 pb-16 pt-6 md:px-12 lg:pb-24 lg:pt-18"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqPageJsonLd() }} />

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-16">
        {/* На телефоне вопросы идут первыми, фотография уходит под них — отсюда порядок в
            разметке и перестановка колонок на большом экране. */}
        <FaqList items={ORDER_FAQ} idPrefix="order-" className="lg:col-start-2 lg:row-start-1" />

        <div className="relative mx-auto aspect-[4/3] w-full max-w-[350px] overflow-hidden rounded-[25px] bg-ink-900 lg:col-start-1 lg:row-start-1 lg:aspect-square lg:max-w-[520px] lg:self-start lg:rounded-[36px] lg:sticky lg:top-27">
          <Image
            src="/images/faq/tuning.webp"
            alt="Настройка ханга в мастерской: мастер снимает спектр ноты по экрану тюнера"
            fill
            sizes="(min-width: 1024px) 520px, 350px"
            className="object-cover object-[38%_50%]"
          />
        </div>
      </div>
    </section>
  );
}
