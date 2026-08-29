import { CONTACT_MAX_URL, CONTACT_TELEGRAM_URL, CONTACT_WHATSAPP_URL } from "@/shared/lib";
import { MaxIcon, TelegramIcon, WhatsAppIcon } from "./assets/icons";

/**
 * Отдельным модулем, а не внутри MessengerLinks: тот стал клиентским ради счёта кликов, а из
 * клиентского модуля серверные компоненты получают не массив, а ссылку — и .map падает.
 */
export const MESSENGERS = [
  { id: "tg", label: "Telegram", href: CONTACT_TELEGRAM_URL, Icon: TelegramIcon },
  { id: "wa", label: "WhatsApp", href: CONTACT_WHATSAPP_URL, Icon: WhatsAppIcon },
  { id: "max", label: "MAX", href: CONTACT_MAX_URL, Icon: MaxIcon },
] as const;
