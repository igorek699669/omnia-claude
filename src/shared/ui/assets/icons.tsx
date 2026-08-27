import type { ComponentProps } from "react";

/**
 * Все иконки проекта в одном месте: одна и та же галочка/крестик/стрелка нужны
 * в разных слайсах, и раньше их пути были скопированы по компонентам.
 *
 * Размер задаётся пропом `size` (одинаковые ширина и высота), всё остальное —
 * обычные атрибуты svg: любой атрибут по умолчанию (`strokeWidth`, `className`,
 * `aria-hidden`) перебивается пропом на месте вызова.
 */
export type IconProps = ComponentProps<"svg"> & { size?: number };

/** Контурные иконки нарисованы в сетке 24×24 одной толщиной штриха. */
const outline = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

const solid = { viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true } as const;

export function CheckIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} {...outline} {...rest}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function CloseIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} {...outline} {...rest}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function PlusIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} {...outline} {...rest}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function MinusIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} {...outline} {...rest}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} {...outline} {...rest}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export function ArrowLeftIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} {...outline} {...rest}>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} {...outline} {...rest}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function MenuIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} {...outline} {...rest}>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

/** Три строки разной длины — «фильтры», не путать с бургер-меню. */
export function FiltersIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} {...outline} {...rest}>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

export function SearchIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} {...outline} {...rest}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function CartIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} {...outline} {...rest}>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

export function TrashIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} {...outline} {...rest}>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function BellIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} {...outline} {...rest}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function UserIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} {...outline} {...rest}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  );
}

export function MailIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} {...outline} {...rest}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

/** Трубка — кнопка набора номера. */
export function PhoneIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} {...outline} {...rest}>
      <path d="M7.5 3.5h-2A2.5 2.5 0 0 0 3 6c0 8.28 6.72 15 15 15a2.5 2.5 0 0 0 2.5-2.5v-2l-4.5-2-2 2.5a15.6 15.6 0 0 1-6-6L10.5 9l-3-5.5z" />
    </svg>
  );
}

/** Пузырь с многоточием — главная кнопка виджета связи. */
export function ChatIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} {...outline} {...rest}>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-7z" />
      <circle cx="8.3" cy="10" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="10" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15.7" cy="10" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PlayIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} {...solid} {...rest}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function PauseIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} {...solid} {...rest}>
      <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
    </svg>
  );
}

export function TelegramIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} {...solid} {...rest}>
      <path d="M21.9 4.6 19 18.9c-.2 1-.8 1.2-1.6.8l-4.4-3.3-2.2 2.1c-.2.2-.4.4-.9.4l.3-4.6 8.5-7.7c.4-.3-.1-.5-.6-.2L7.7 13l-4.4-1.4c-1-.3-1-1 .2-1.4l17-6.6c.8-.3 1.5.2 1.4 1z" />
    </svg>
  );
}

export function WhatsAppIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} {...solid} {...rest}>
      <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm5.3 14.3c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.4-.7-2.9-1.1-4.7-4-4.9-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.5.8 1.9.8 2 .1.1.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l.9-1c.2-.3.4-.2.7-.1l1.8.9c.3.1.5.2.5.3.1.1.1.7-.1 1.1z" />
    </svg>
  );
}

/** Логотип MAX нарисован в сетке 1000×1000 — свой viewBox, а не общий 24×24. */
export function MaxIcon({ size = 24, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 1000 1000" fill="currentColor" aria-hidden {...rest}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M508.211 878.328c-75.007 0-109.864-10.95-170.453-54.75-38.325 49.275-159.686 87.783-164.979 21.9 0-49.456-10.95-91.248-23.36-136.873-14.782-56.21-31.572-118.807-31.572-209.508 0-216.626 177.754-379.597 388.357-379.597 210.786 0 375.947 171.001 375.947 381.604.707 207.347-166.595 376.118-373.94 377.224m3.103-571.585c-102.564-5.292-182.499 65.7-200.201 177.024-14.6 92.162 11.315 204.398 33.397 210.238 10.585 2.555 37.23-18.98 53.837-35.587a189.8 189.8 0 0 0 92.71 33.032c106.273 5.112 197.08-75.794 204.215-181.95 4.154-106.382-77.67-196.486-183.958-202.574z"
      />
    </svg>
  );
}

/** Круговой индикатор загрузки. Останавливается при prefers-reduced-motion. */
export function Spinner({ size = 20, className = "", ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={`animate-spin motion-reduce:animate-none ${className}`}
      {...rest}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Указательная стрелка виджета связи: остриё (82;70) специально уводится за нижний
 * край блока — оно должно смотреть в центр кнопки, а не в пустоту рядом с ней.
 * Размер фиксированный: дуга рисуется под конкретное расстояние до кнопки.
 */
export function PointerArrowIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden width="96" height="88" viewBox="0 0 96 88" fill="none" className={className}>
      <path d="M8 14C44 2 80 14 82 70" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path
        d="M89.5 55.9 82 70l-8.5-13.6"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
