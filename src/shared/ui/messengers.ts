import { CONTACT_MAX_URL, CONTACT_TELEGRAM_URL, CONTACT_WHATSAPP_URL } from "@/shared/lib";
import { MaxIcon, TelegramIcon, WhatsAppIcon } from "./assets/icons";

/**
 * Набор мессенджеров — отдельным модулем, а не внутри MessengerLinks: тот стал
 * клиентским ради счёта кликов, а из клиентского модуля серверные компоненты
 * (подвал, шапка) получают не сам массив, а ссылку на него, и .map на сервере падает.
 */
export const MESSENGERS = [
  { id: "tg", label: "Telegram", href: CONTACT_TELEGRAM_URL, Icon: TelegramIcon },
  { id: "wa", label: "WhatsApp", href: CONTACT_WHATSAPP_URL, Icon: WhatsAppIcon },
  { id: "max", label: "MAX", href: CONTACT_MAX_URL, Icon: MaxIcon },
] as const;
