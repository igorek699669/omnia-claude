import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui";
import { CONTACT_TELEGRAM_URL, siteUrl } from "@/shared/lib";
import { GUIDE_TOPICS } from "../../model/faq-content";
import { FaqList } from "./FaqList";
import { WorkshopVideo } from "./WorkshopVideo";

/**
 * Ролик о производстве и 16 вопросов об инструменте — сразу после секции про сталь.
 *
 * Порядок в разметке (заголовок → видео → вопросы) задан телефоном: там колонка одна, и
 * видео без заголовка над ним появлялось бы вообще без объяснения. На большом экране сетка
 * переставляет ролик в левую колонку, не меняя порядок чтения.
 *
 * Панели тем смонтированы все сразу (forceMount): неактивные Radix помечает hidden, так что
 * в фокус они не попадают, но текст ответов есть в HTML до единого клика — иначе поисковик
 * увидел бы только четыре вопроса из шестнадцати.
 */
/**
 * Разметка ролика для поисковика. Адреса абсолютные: относительный путь к файлу и обложке
 * здесь не годится — их скачивает робот, а не браузер посетителя.
 *
 * Ролик лежит внутри длинной главной, то есть для видеопоиска это дополнительное содержание
 * страницы, а не её цель. Отдельные видеорезультаты потребовали бы страницы, посвящённой
 * одному ролику; такой страницы у магазина нет и в этой задаче не заводится.
 */
function videoJsonLd(): string {
  const base = siteUrl();

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: "Так звучит сталь. 11 этапов изготовления хендпана Omnia",
    description:
      "Съёмка производства в мастерской Omnia: от стального листа до настроенного хендпана. 11 этапов создания инструмента.",
    thumbnailUrl: new URL("/video/workshop-poster.jpg", base).toString(),
    contentUrl: new URL("/video/omnia-workshop.mp4", base).toString(),
    uploadDate: "2026-09-11",
    duration: "PT1M45S",
  }).replace(/</g, "\\u003c");
}

export function HandpanGuide() {
  return (
    <section
      id="handpan-guide"
      aria-labelledby="handpan-guide-title"
      className="mx-auto max-w-[1440px] scroll-mt-24 px-5 py-14 md:px-12 lg:py-24"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: videoJsonLd() }} />

      {/* Промежуток между колонками широкий, между строками — нет: одно значение на оба
          отрывало бы вкладки от вводного текста на те же 72 px. */}
      <div className="grid gap-8 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)] lg:gap-x-18 lg:gap-y-6 xl:grid-cols-[400px_minmax(0,1fr)] xl:gap-x-24">
        <div className="lg:col-start-2 lg:row-start-1">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.11em] text-ink-600">
            <span aria-hidden className="size-1.5 rounded-full bg-brand" />
            Знакомство с инструментом
          </p>
          <h2
            id="handpan-guide-title"
            className="mt-5 font-display text-[38px] font-semibold leading-[1.12] lg:text-[clamp(36px,3.4vw,49px)] lg:leading-[1.14]"
          >
            Хендпан:
            <br />
            <span className="text-brand">от идеи до первого звука</span>
          </h2>
          <p className="mt-5 max-w-[58ch] text-[17px] leading-relaxed text-ink-600">
            Откуда появился хендпан, как выбрать свой и что стоит за его звучанием. В видео —
            11 этапов создания инструмента в мастерской Omnia.
          </p>
        </div>

        <figure className="mx-auto w-full max-w-[330px] lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:max-w-none lg:self-start">
          <div className="lg:sticky lg:top-26">
            <WorkshopVideo />
            <figcaption className="mt-3.5 text-center text-sm leading-normal text-ink-600">
              Мастерская изнутри
            </figcaption>
          </div>
        </figure>

        <div className="lg:col-start-2 lg:row-start-2">
          <Tabs defaultValue={GUIDE_TOPICS[0].id}>
            <TabsList variant="underline" aria-label="Темы вопросов об инструменте">
              {GUIDE_TOPICS.map((topic) => (
                <TabsTrigger key={topic.id} variant="underline" value={topic.id}>
                  {topic.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {GUIDE_TOPICS.map((topic) => (
              <TabsContent key={topic.id} value={topic.id} forceMount>
                <FaqList items={topic.items} idPrefix="q-" className="mt-2" />
              </TabsContent>
            ))}
          </Tabs>

          <p className="mt-8 text-[17px] text-ink-600">Хотите обсудить свой будущий инструмент?</p>
          <a
            href={CONTACT_TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 font-medium text-brand-link underline underline-offset-4 transition-colors hover:text-brand-dark"
          >
            Написать мастеру
            <span aria-hidden>↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}
