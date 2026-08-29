import Link from "next/link";
import { siteUrl } from "@/shared/lib";

export interface Crumb {
  name: string;
  /** Без адреса — текущая страница: последняя крошка ссылкой не делается. */
  href?: string;
}

/**
 * Навигационная цепочка «Главная → Каталог → Ханг D Kurd 11».
 *
 * Видимые ссылки и разметка BreadcrumbList рядом, одним компонентом: поисковик берёт
 * цепочку из разметки, а покупателю с карточки нужен путь обратно в каталог — до этого
 * с карточки не вело ни одной ссылки на другой товар или раздел.
 */
export function Breadcrumbs({ items, className = "" }: { items: Crumb[]; className?: string }) {
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.href ? { item: new URL(item.href, siteUrl()).toString() } : {}),
    })),
    // Название товара приходит из админки — экранируем «<», иначе оно оборвёт <script>.
  }).replace(/</g, "\\u003c");

  return (
    <nav aria-label="Хлебные крошки" className={className}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-600">
        {items.map((item, index) => (
          <li key={item.name} className="flex items-center gap-2">
            {index > 0 && (
              <span aria-hidden className="text-ink-900/25">
                /
              </span>
            )}
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-brand-dark">
                {item.name}
              </Link>
            ) : (
              <span className="text-ink-900">{item.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
