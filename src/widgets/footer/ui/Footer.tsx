import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-12 rounded-t-card bg-ink-900 text-paper-50">
      <div className="mx-auto max-w-[1440px] px-5 md:px-12">
        <div className="grid grid-cols-2 gap-12 py-18 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="font-display text-[26px] font-semibold uppercase tracking-[0.16em]">
              Omn<b className="font-semibold text-brand">i</b>a
            </Link>
            <p className="mt-4 max-w-[34ch] text-sm text-paper-50/60">
              Мастерская хангов из нержавеющей стали. Ручная настройка, честные цены,
              доставка по всей России.
            </p>
          </div>
          <FooterCol title="Магазин" links={[["Каталог", "/catalog"], ["Подбор звука", "/#sound"], ["Доставка и оплата", "/delivery"]]} />
          <FooterCol title="Покупателям" links={[["Личный кабинет", "/profile"], ["Вопросы и ответы", "/#faq"], ["Политика конфиденциальности", "#"], ["Публичная оферта", "#"]]} />
          <div>
            <h4 className="mb-5 font-display text-base font-medium uppercase tracking-wider text-paper-50/70">
              Связаться
            </h4>
            <p className="text-[13px] text-paper-50/50">Номер телефона</p>
            <a href="tel:+79000000000" className="font-display text-[22px] transition-colors hover:text-brand">
              +7 (900) 000-00-00
            </a>
            <p className="mt-3">
              <a href="mailto:hello@omnia.ru" className="text-[15px] transition-colors hover:text-brand">
                hello@omnia.ru
              </a>
            </p>
            <p className="mt-5 text-[13px] text-paper-50/50">Мы на связи в соцсетях</p>
            <div className="mt-3 flex gap-2.5">
              <Social label="Telegram"><path d="M21.9 4.6 19 18.9c-.2 1-.8 1.2-1.6.8l-4.4-3.3-2.2 2.1c-.2.2-.4.4-.9.4l.3-4.6 8.5-7.7c.4-.3-.1-.5-.6-.2L7.7 13l-4.4-1.4c-1-.3-1-1 .2-1.4l17-6.6c.8-.3 1.5.2 1.4 1z" /></Social>
              <Social label="WhatsApp"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm5.3 14.3c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.4-.7-2.9-1.1-4.7-4-4.9-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.5.8 1.9.8 2 .1.1.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l.9-1c.2-.3.4-.2.7-.1l1.8.9c.3.1.5.2.5.3.1.1.1.7-.1 1.1z" /></Social>
              <Social label="ВКонтакте"><path d="M13.2 17.5C7.6 17.5 4.3 13.6 4.2 7h2.8c.1 4.8 2.3 6.9 4 7.3V7h2.7v4.2c1.7-.2 3.4-2.1 4-4.2h2.7c-.5 2.6-2.3 4.5-3.6 5.3 1.3.6 3.4 2.3 4.2 5.2h-3c-.6-1.9-2.1-3.4-4.3-3.6v3.6h-.5z" /></Social>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-3 border-t border-paper-50/12 py-6 pb-10 text-[13px] text-paper-50/50 sm:flex-row">
          <span>© {new Date().getFullYear()} Omnia. Все права защищены.</span>
          <span>Сделано в мастерской</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="mb-5 font-display text-base font-medium uppercase tracking-wider text-paper-50/70">
        {title}
      </h4>
      <ul className="flex flex-col gap-3">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="text-[15px] transition-colors hover:text-brand">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Social({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <a
      href="#"
      aria-label={label}
      className="grid size-9.5 place-items-center rounded-full border border-paper-50/25 transition-colors hover:border-brand hover:text-brand"
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">{children}</svg>
    </a>
  );
}
