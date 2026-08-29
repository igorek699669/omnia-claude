import { siteUrl } from "./site-url";
import { CONTACT_EMAIL, CONTACT_PHONE_HREF, CONTACT_TELEGRAM_URL, CONTACT_WHATSAPP_URL } from "./contacts";
import { SELLER_INN, SELLER_LEGAL_NAME } from "./legal";

/**
 * Картинка превью по умолчанию — единственный кадр в каталоге с пропорцией под соцсети
 * (1918×1007 ≈ 1.9:1).
 *
 * Лежит отдельно, потому что нужна в двух местах сразу. Next не сливает openGraph
 * дочерней страницы с родительским, а заменяет его целиком: страница, объявившая свой
 * openGraph без images, остаётся вообще без превью, даже если картинка задана в корневом
 * layout. Поэтому каждая такая страница обязана подставить фолбэк сама.
 */
export const DEFAULT_OG_IMAGE = {
  url: "/images/steel/steel-handpan.png",
  width: 1918,
  height: 1007,
} as const;

/**
 * Визитка мастерской для поисковиков — один раз на весь сайт, из корневого layout.
 *
 * Адрес намеренно без улицы и дома: SELLER_CLAIMS_ADDRESS — это квартира для письменных
 * претензий, а не торговая точка, и публиковать её как адрес магазина нельзя. Города
 * достаточно, чтобы связать организацию с регионом.
 */
export function organizationJsonLd(): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: "Omnia",
    alternateName: "Мастерская хангов Omnia",
    description:
      "Мастерская хангов (хэндпанов) ручной работы из нержавеющей стали: ручная настройка каждой ноты, доставка СДЭК по России.",
    url: siteUrl(),
    email: CONTACT_EMAIL,
    telephone: CONTACT_PHONE_HREF.replace("tel:", ""),
    founder: { "@type": "Person", name: SELLER_LEGAL_NAME },
    taxID: SELLER_INN,
    address: { "@type": "PostalAddress", addressLocality: "Брянск", addressCountry: "RU" },
    sameAs: [CONTACT_TELEGRAM_URL, CONTACT_WHATSAPP_URL],
  };

  return JSON.stringify(data).replace(/</g, "\\u003c");
}
