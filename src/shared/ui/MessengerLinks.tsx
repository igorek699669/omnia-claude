import { CONTACT_MAX_URL, CONTACT_TELEGRAM_URL, CONTACT_WHATSAPP_URL } from "@/shared/lib";
import { MaxIcon, TelegramIcon, WhatsAppIcon } from "./assets/icons";

export const MESSENGERS = [
  { id: "tg", label: "Telegram", href: CONTACT_TELEGRAM_URL, Icon: TelegramIcon },
  { id: "wa", label: "WhatsApp", href: CONTACT_WHATSAPP_URL, Icon: WhatsAppIcon },
  { id: "max", label: "MAX", href: CONTACT_MAX_URL, Icon: MaxIcon },
] as const;

/** Третичный уровень: рядом с кнопкой покупки ряд не должен спорить с ней за внимание. */
const tone =
  "bg-paper-100 text-ink-900 hover:bg-paper-200 hover:text-brand-dark focus-visible:bg-paper-200";

/**
 * Ряд бейджиков-мессенджеров: в карточке товара и на странице товара
 * это единственный способ спросить про строй до покупки.
 * Название мессенджера — тултип на ховере плюс aria-label для скринридера.
 */
export function MessengerLinks({
  className = "",
  size = "sm",
}: {
  className?: string;
  /** lg — когда ряд стоит в одну линию с кнопкой действия и должен совпадать с ней по высоте. */
  size?: "sm" | "lg";
}) {
  const lg = size === "lg";

  return (
    <div className={`flex items-center justify-center ${lg ? "gap-2.5" : "gap-2"} ${className}`}>
      {MESSENGERS.map(({ id, label, href, Icon }) => (
        <a
          key={id}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Написать в ${label}`}
          className={`group relative grid place-items-center rounded-full transition-colors ${tone} ${lg ? "size-[58px]" : "size-9"}`}
        >
          <Icon size={lg ? 24 : 17} />
          <span
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink-900 px-2.5 py-1 text-[12px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            {label}
          </span>
        </a>
      ))}
    </div>
  );
}
