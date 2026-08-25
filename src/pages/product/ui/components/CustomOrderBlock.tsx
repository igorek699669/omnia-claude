import { CONTACT_TELEGRAM_URL, CONTACT_WHATSAPP_URL, CONTACT_MAX_URL } from "@/shared/lib";

/**
 * Показывается только у товара не в наличии, сразу под «Уведомить о наличии»:
 * ждать поставку — не единственный вариант, тот же строй мастерская делает под заказ.
 * Сроки и цену намеренно не пишем — они зависят от строя, это тема для разговора в мессенджере.
 */
export function CustomOrderBlock() {
  return (
    <div className="mt-8 rounded-card bg-paper-100 p-6 md:p-7">
      <h2 className="font-display text-[22px] font-medium leading-snug">Инструмент под заказ</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
        Изготовим этот строй специально для вас. Напишите нам
        в удобный мессенджер.
      </p>
      <div className="mt-5 flex flex-wrap gap-2.5">
        <Messenger href={CONTACT_TELEGRAM_URL} label="Telegram">
          <path d="M21.9 4.6 19 18.9c-.2 1-.8 1.2-1.6.8l-4.4-3.3-2.2 2.1c-.2.2-.4.4-.9.4l.3-4.6 8.5-7.7c.4-.3-.1-.5-.6-.2L7.7 13l-4.4-1.4c-1-.3-1-1 .2-1.4l17-6.6c.8-.3 1.5.2 1.4 1z" />
        </Messenger>
        <Messenger href={CONTACT_WHATSAPP_URL} label="WhatsApp">
          <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm5.3 14.3c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.4-.7-2.9-1.1-4.7-4-4.9-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.5.8 1.9.8 2 .1.1.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l.9-1c.2-.3.4-.2.7-.1l1.8.9c.3.1.5.2.5.3.1.1.1.7-.1 1.1z" />
        </Messenger>
        <Messenger href={CONTACT_MAX_URL} label="MAX" viewBox="0 0 1000 1000">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M508.211 878.328c-75.007 0-109.864-10.95-170.453-54.75-38.325 49.275-159.686 87.783-164.979 21.9 0-49.456-10.95-91.248-23.36-136.873-14.782-56.21-31.572-118.807-31.572-209.508 0-216.626 177.754-379.597 388.357-379.597 210.786 0 375.947 171.001 375.947 381.604.707 207.347-166.595 376.118-373.94 377.224m3.103-571.585c-102.564-5.292-182.499 65.7-200.201 177.024-14.6 92.162 11.315 204.398 33.397 210.238 10.585 2.555 37.23-18.98 53.837-35.587a189.8 189.8 0 0 0 92.71 33.032c106.273 5.112 197.08-75.794 204.215-181.95 4.154-106.382-77.67-196.486-183.958-202.574z"
          />
        </Messenger>
      </div>
    </div>
  );
}

function Messenger({
  href,
  label,
  viewBox = "0 0 24 24",
  children,
}: {
  href: string;
  label: string;
  viewBox?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[15px] font-medium transition-colors hover:bg-brand hover:text-white"
    >
      <svg width="18" height="18" viewBox={viewBox} fill="currentColor" aria-hidden>
        {children}
      </svg>
      {label}
    </a>
  );
}
