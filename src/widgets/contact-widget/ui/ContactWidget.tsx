"use client";

import { useEffect, useRef, useState } from "react";
import {
  CONTACT_EMAIL_HREF,
  CONTACT_MAX_URL,
  CONTACT_TELEGRAM_URL,
  CONTACT_WHATSAPP_URL,
} from "@/shared/lib";
import { onContactWidgetPing } from "../model/attention";

/**
 * dx/dy — смещение от главной кнопки при раскрытии (дуга слева-сверху, безопасная для правого нижнего угла).
 * Радиус 120 при шаге 30° даёт между соседними кнопками ~62px по центрам — больше их диаметра (50px),
 * иначе кружки наезжают друг на друга (было при радиусе 80).
 */
const links = [
  { label: "Написать в WhatsApp", href: CONTACT_WHATSAPP_URL, external: true, icon: "wa", dx: -120, dy: 0 },
  { label: "Написать в Telegram", href: CONTACT_TELEGRAM_URL, external: true, icon: "tg", dx: -104, dy: -60 },
  { label: "Написать в MAX", href: CONTACT_MAX_URL, external: true, icon: "max", dx: -60, dy: -104 },
  { label: "Написать на почту", href: CONTACT_EMAIL_HREF, external: false, icon: "mail", dx: 0, dy: -120 },
] as const;

/** Плавающий виджет связи — фиксирован в правом нижнем углу поверх любого контента. */
export function ContactWidget() {
  const [open, setOpen] = useState(false);
  const [attention, setAttention] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Кнопки на страницах («Задать вопрос» в CTA-блоке) просят виджет мигнуть — чтобы пользователь его заметил.
  useEffect(
    () =>
      onContactWidgetPing(() => {
        setOpen(false);
        // Снимаем класс перед повторным навешиванием: иначе второй клик подряд не перезапустит анимацию.
        setAttention(false);
        requestAnimationFrame(() => setAttention(true));
      }),
    [],
  );

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="fixed bottom-5 right-4 z-40 md:bottom-7 md:right-7">
      <div className="relative size-14">
        {attention && <PointerArrow />}

        {links.map(({ label, href, external, icon, dx, dy }, i) => (
          <a
            key={icon}
            href={href}
            aria-label={label}
            aria-hidden={!open}
            tabIndex={open ? 0 : -1}
            title={label}
            onClick={() => setOpen(false)}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            style={{
              transform: open ? `translate(${dx}px, ${dy}px) scale(1)` : "translate(0, 0) scale(0.3)",
              opacity: open ? 1 : 0,
              transitionDelay: open ? `${i * 40}ms` : `${(links.length - 1 - i) * 30}ms`,
            }}
            className={`absolute bottom-0 right-0 grid size-12.5 place-items-center rounded-full bg-white text-ink-900 shadow-[0_12px_28px_-8px_rgba(28,20,16,0.35)] transition-[transform,opacity] duration-300 ease-out hover:bg-brand hover:text-white ${open ? "pointer-events-auto" : "pointer-events-none"}`}
          >
            <ContactIcon icon={icon} />
          </a>
        ))}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Закрыть контакты" : "Написать нам"}
          aria-expanded={open}
          className={`relative z-10 grid size-14 cursor-pointer place-items-center rounded-full bg-brand text-white shadow-[0_12px_28px_-8px_rgba(28,20,16,0.35)] transition-colors hover:bg-brand-dark ${attention ? "animate-widget-attention" : open ? "" : "animate-widget-pulse"}`}
          onAnimationEnd={(e) => {
            if (e.animationName.includes("contact-widget-attention")) setAttention(false);
          }}
        >
          <span className={`transition-transform duration-300 ${open ? "rotate-90" : ""}`}>
            {open ? <CloseIcon /> : <MessageIcon />}
          </span>
        </button>
      </div>
    </div>
  );
}

/**
 * Указательная стрелка, которая на пару секунд подрисовывается слева-сверху от кнопки.
 * Остриё (82;70 в системе координат svg) специально уводим за нижний край блока — оно должно смотреть
 * в центр кнопки, а не в пустоту рядом с ней.
 */
function PointerArrow() {
  return (
    <svg
      aria-hidden
      width="96"
      height="88"
      viewBox="0 0 96 88"
      fill="none"
      className="animate-widget-arrow pointer-events-none absolute bottom-13 right-2 text-brand drop-shadow-[0_4px_10px_rgba(255,89,0,0.35)]"
    >
      <path
        d="M8 14C44 2 80 14 82 70"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
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

function MessageIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-7z" />
      <circle cx="8.3" cy="10" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="10" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15.7" cy="10" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function ContactIcon({ icon }: { icon: (typeof links)[number]["icon"] }) {
  switch (icon) {
    case "wa":
      return (
        <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm5.3 14.3c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.4-.7-2.9-1.1-4.7-4-4.9-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.5.8 1.9.8 2 .1.1.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l.9-1c.2-.3.4-.2.7-.1l1.8.9c.3.1.5.2.5.3.1.1.1.7-.1 1.1z" />
        </svg>
      );
    case "tg":
      return (
        <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.9 4.6 19 18.9c-.2 1-.8 1.2-1.6.8l-4.4-3.3-2.2 2.1c-.2.2-.4.4-.9.4l.3-4.6 8.5-7.7c.4-.3-.1-.5-.6-.2L7.7 13l-4.4-1.4c-1-.3-1-1 .2-1.4l17-6.6c.8-.3 1.5.2 1.4 1z" />
        </svg>
      );
    case "max":
      return (
        <svg width="20" height="20" viewBox="0 0 1000 1000" fill="currentColor">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M508.211 878.328c-75.007 0-109.864-10.95-170.453-54.75-38.325 49.275-159.686 87.783-164.979 21.9 0-49.456-10.95-91.248-23.36-136.873-14.782-56.21-31.572-118.807-31.572-209.508 0-216.626 177.754-379.597 388.357-379.597 210.786 0 375.947 171.001 375.947 381.604.707 207.347-166.595 376.118-373.94 377.224m3.103-571.585c-102.564-5.292-182.499 65.7-200.201 177.024-14.6 92.162 11.315 204.398 33.397 210.238 10.585 2.555 37.23-18.98 53.837-35.587a189.8 189.8 0 0 0 92.71 33.032c106.273 5.112 197.08-75.794 204.215-181.95 4.154-106.382-77.67-196.486-183.958-202.574z"
          />
        </svg>
      );
    case "mail":
      return (
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="m4 7 8 6 8-6" />
        </svg>
      );
  }
}
