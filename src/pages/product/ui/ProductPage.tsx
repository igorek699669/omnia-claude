import { notFound } from "next/navigation";
import Image from "next/image";
import {
  getProductBySlug,
  productHeading,
  ProductGallery,
  PRODUCT_PAGE_IMAGE_SIZES,
  HANDPAN_DIAMETER_CM,
  HANDPAN_RIM_CM,
  HANDPAN_WEIGHT_GRAMS,
  HANDPAN_MATERIAL,
} from "@/entities/product";
import { formatPrice } from "@/shared/lib";
import { Tag, HandpanArt, AudioPlayerBar, Breadcrumbs } from "@/shared/ui";
import { productJsonLd } from "../seo";
import { AddToCartSection } from "./components/AddToCartSection";
import { CustomOrderBlock } from "./components/CustomOrderBlock";
import { RelatedProducts } from "./components/RelatedProducts";

export async function ProductPage({ slug }: { slug: string }) {
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  // Логика та же, что в карточке каталога: слайдер только при нескольких кадрах,
  // иначе одно фото; HandpanArt остаётся на случай товара без медиа.
  const media = product.media;

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-12">
      {/* Разметка Product для поисковиков — цена и наличие попадают прямо в сниппет выдачи. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: productJsonLd(product) }} />

      <Breadcrumbs
        className="mb-8"
        items={[
          { name: "Главная", href: "/" },
          { name: "Каталог", href: "/catalog" },
          { name: product.name },
        ]}
      />

      <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="relative">
          <div className="relative aspect-square overflow-hidden rounded-card bg-white">
            <div className="absolute inset-6 md:inset-10">
              {media.length > 1 ? (
                <ProductGallery media={media} sizes={PRODUCT_PAGE_IMAGE_SIZES} fit="contain" />
              ) : media[0] ? (
                <Image
                  src={media[0].url}
                  alt={media[0].alt}
                  fill
                  sizes={PRODUCT_PAGE_IMAGE_SIZES}
                  priority
                  className="object-contain"
                />
              ) : (
                <HandpanArt className="absolute inset-0 m-auto h-full w-full" />
              )}
            </div>
          </div>
          {product.audioSample && (
            <AudioPlayerBar
              src={product.audioSample}
              className="absolute inset-x-6 bottom-6"
            />
          )}
        </div>

        <div>
          <Tag>{product.inStock ? "В наличии" : "Под заказ"}</Tag>
          {/* Не одно имя «Ханг D Kurd 11»: заголовок сразу отвечает, сколько нот и какой
              строй, — именно этими словами инструмент и ищут. */}
          <h1 className="mt-5 font-display text-[clamp(36px,4vw,56px)] font-medium leading-[1.05] tracking-tight">
            {productHeading(product)}
          </h1>

          <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-4 border-y border-ink-900/10 py-6 text-[15px]">
            <Spec label="Звукоряд">{product.scaleNotes}</Spec>
            <Spec label="Количество нот">{product.notesCount}</Spec>
            <Spec label="Диаметр">
              {HANDPAN_DIAMETER_CM} см (+{HANDPAN_RIM_CM} см окантовка)
            </Spec>
            <Spec label="Вес">{(HANDPAN_WEIGHT_GRAMS / 1000).toLocaleString("ru-RU")} кг</Spec>
            <Spec label="Материал">{HANDPAN_MATERIAL}</Spec>
            <Spec label="Настройка">{product.tuningHz} Гц</Spec>
          </dl>

          <div className="mt-8 flex items-baseline gap-4">
            <span className="font-display text-[40px] font-semibold">{formatPrice(product.price)}</span>
            {product.oldPrice && <s className="text-xl text-ink-600">{formatPrice(product.oldPrice)}</s>}
          </div>

          <AddToCartSection product={product} />

          {!product.inStock && <CustomOrderBlock />}

          <p className="mt-6 text-sm text-ink-600">
            Доставка СДЭК по всей России — трек-номер появится
            в личном кабинете после отправки.
          </p>
          <p className="mt-2 text-sm text-ink-600">
            Ханг не подключается к электросети и не подлежит обязательной сертификации или
            декларированию соответствия.
          </p>
        </div>
      </div>

      <RelatedProducts product={product} />
    </section>
  );
}

function Spec({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[13px] uppercase tracking-wider text-ink-600">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}
