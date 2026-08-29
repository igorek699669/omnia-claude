"use client";

// Клиентский не ради состояния, а ради счёта: клик по мессенджеру — это лид, и без него
// в Метрике видно только «сколько зашло».
import { reachGoal, GOALS } from "@/shared/lib";
import { MESSENGERS } from "./messengers";

const tone =
  "bg-paper-100 text-ink-900 hover:bg-paper-200 hover:text-brand-dark focus-visible:bg-paper-200";

/**
 * Ряд бейджиков-мессенджеров: в карточке и на странице товара это единственный способ
 * спросить про строй до покупки. Название — тултип на ховере плюс aria-label.
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
          onClick={() => reachGoal(GOALS.messengerClick, { channel: id })}
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
