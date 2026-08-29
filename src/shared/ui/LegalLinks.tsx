import Link from "next/link";

const links = [
  ["Публичная оферта", "/oferta"],
  ["Политика конфиденциальности", "/privacy"],
  ["Возврат и обмен", "/return"],
  ["Контакты", "/requisites"],
  ["Пользовательское соглашение", "/terms"],
] as const;

/**
 * Рендерится только внутри оформления заказа, поэтому все ссылки открываются в новой вкладке:
 * уход со страницы стёр бы заполненную форму — она живёт в state компонента, не в storage.
 */
export function LegalLinks() {
  return (
    <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13px] text-ink-600">
      {links.map(([label, href]) => (
        <Link
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-brand-dark"
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
