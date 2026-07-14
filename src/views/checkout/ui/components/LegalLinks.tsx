const links = [
  ["Публичная оферта", "#"],
  ["Политика конфиденциальности", "#"],
  ["Политика возврата средств", "#"],
  ["Контакты", "#"],
] as const;

export function LegalLinks() {
  return (
    <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13px] text-ink-600">
      {links.map(([label, href]) => (
        <a key={label} href={href} className="transition-colors hover:text-brand-dark">
          {label}
        </a>
      ))}
      <a href="#" className="w-full text-center transition-colors hover:text-brand-dark">
        Условия предоставления услуг
      </a>
    </div>
  );
}
