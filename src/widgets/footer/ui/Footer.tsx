import Link from "next/link";
import {
  CONTACT_PHONE,
  CONTACT_PHONE_HREF,
  CONTACT_EMAIL,
  CONTACT_EMAIL_HREF,
} from "@/shared/lib";
import { MESSENGERS } from "@/shared/ui";

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
              {MESSENGERS.map(({ id, label, href, Icon }) => (
                <Social key={id} label={label} href={href}>
                  <Icon size={17} />
                </Social>
              ))}
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
  children,
}: {
  label: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      {...(href !== "#" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="grid size-9.5 place-items-center rounded-full border border-paper-50/25 transition-colors hover:border-brand hover:text-brand"
    >
      {children}
    </a>
  );
}
