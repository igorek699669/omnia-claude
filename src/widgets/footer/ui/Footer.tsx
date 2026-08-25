import Link from "next/link";
import {
  CONTACT_PHONE,
  CONTACT_PHONE_HREF,
  CONTACT_EMAIL,
  CONTACT_EMAIL_HREF,
  CONTACT_TELEGRAM_URL,
  CONTACT_WHATSAPP_URL,
  CONTACT_MAX_URL,
} from "@/shared/lib";

const [emailLocalPart, emailDomain] = CONTACT_EMAIL.split("@");

export function Footer() {
  return (
    <footer className="mt-12 rounded-t-card bg-ink-900 text-paper-50">
      <div className="mx-auto max-w-[1440px] px-5 md:px-12">
        <div className="grid grid-cols-2 gap-12 py-18 md:grid-cols-[1.2fr_1fr_1fr_1fr_1fr]">
          <div className="col-span-2 min-w-0 md:col-span-1">
            <Link href="/" className="font-display text-[20px] font-semibold tracking-[0.16em] sm:text-[26px]">
              <b className="font-semibold text-brand">OM</b>NIA
            </Link>
            <p className="mt-4 max-w-[34ch] text-sm text-paper-50/60">
              Мастерская хангов из нержавеющей стали. Ручная настройка, честные цены,
              доставка по всей России.
            </p>
          </div>
          <FooterCol title="Магазин" links={[["Каталог", "/catalog"], ["Доставка и оплата", "/delivery"], ["Возврат и обмен", "/return"]]} />
          <FooterCol title="Покупателям" links={[["Личный кабинет", "/profile"], ["Вопросы и ответы", "/#faq"], ["Контакты и реквизиты", "/requisites"]]} />
          <FooterCol
            title="Документы"
            links={[
              ["Публичная оферта", "/oferta"],
              ["Политика конфиденциальности", "/privacy"],
              ["Политика cookie", "/cookie-policy"],
              ["Пользовательское соглашение", "/terms"],
            ]}
          />
          <div className="min-w-0">
            <h4 className="mb-5 font-display text-base font-medium uppercase tracking-wider text-paper-50/70">
              Связаться
            </h4>
            <p className="text-[13px] text-paper-50/50">Номер телефона</p>
            <a href={CONTACT_PHONE_HREF} className="font-display text-[22px] transition-colors hover:text-brand">
              {CONTACT_PHONE}
            </a>
            <p className="mt-3">
              {/* Почта — одно длинное «слово»: в узкой колонке на мобиле она вылезала за край.
                  <wbr/> после @ даёт красивую точку переноса, break-words — страховка для совсем узких экранов. */}
              <a href={CONTACT_EMAIL_HREF} className="text-[15px] break-words transition-colors hover:text-brand">
                {emailLocalPart}@<wbr />
                {emailDomain}
              </a>
            </p>
            <p className="mt-5 text-[13px] text-paper-50/50">Мы на связи в соцсетях</p>
            <div className="mt-3 flex gap-2.5">
              <Social label="Telegram" href={CONTACT_TELEGRAM_URL}><path d="M21.9 4.6 19 18.9c-.2 1-.8 1.2-1.6.8l-4.4-3.3-2.2 2.1c-.2.2-.4.4-.9.4l.3-4.6 8.5-7.7c.4-.3-.1-.5-.6-.2L7.7 13l-4.4-1.4c-1-.3-1-1 .2-1.4l17-6.6c.8-.3 1.5.2 1.4 1z" /></Social>
              <Social label="WhatsApp" href={CONTACT_WHATSAPP_URL}><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm5.3 14.3c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.4-.7-2.9-1.1-4.7-4-4.9-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.5.8 1.9.8 2 .1.1.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l.9-1c.2-.3.4-.2.7-.1l1.8.9c.3.1.5.2.5.3.1.1.1.7-.1 1.1z" /></Social>
              <Social label="MAX" href={CONTACT_MAX_URL} viewBox="0 0 1000 1000">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M508.211 878.328c-75.007 0-109.864-10.95-170.453-54.75-38.325 49.275-159.686 87.783-164.979 21.9 0-49.456-10.95-91.248-23.36-136.873-14.782-56.21-31.572-118.807-31.572-209.508 0-216.626 177.754-379.597 388.357-379.597 210.786 0 375.947 171.001 375.947 381.604.707 207.347-166.595 376.118-373.94 377.224m3.103-571.585c-102.564-5.292-182.499 65.7-200.201 177.024-14.6 92.162 11.315 204.398 33.397 210.238 10.585 2.555 37.23-18.98 53.837-35.587a189.8 189.8 0 0 0 92.71 33.032c106.273 5.112 197.08-75.794 204.215-181.95 4.154-106.382-77.67-196.486-183.958-202.574z"
                />
              </Social>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-3 border-t border-paper-50/12 py-6 pb-10 text-[13px] text-paper-50/50 sm:flex-row">
          <span>© {new Date().getFullYear()} Omnia. Все права защищены.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div className="min-w-0">
      <h4 className="mb-5 font-display text-base font-medium uppercase tracking-wider text-paper-50/70">
        {title}
      </h4>
      <ul className="flex flex-col gap-3">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="wrap-break-word text-[15px] transition-colors hover:text-brand">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Social({
  label,
  href,
  viewBox = "0 0 24 24",
  children,
}: {
  label: string;
  href: string;
  viewBox?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      {...(href !== "#" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="grid size-9.5 place-items-center rounded-full border border-paper-50/25 transition-colors hover:border-brand hover:text-brand"
    >
      <svg width="17" height="17" viewBox={viewBox} fill="currentColor">{children}</svg>
    </a>
  );
}
