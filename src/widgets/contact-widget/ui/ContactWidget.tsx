"use client";

import { useEffect, useRef, useState } from "react";
import { CONTACT_EMAIL_HREF, reachGoal, GOALS } from "@/shared/lib";
import { ChatIcon, CloseIcon, MailIcon, MESSENGERS, PointerArrowIcon } from "@/shared/ui";
import { onContactWidgetPing } from "../model/attention";

/**
 * dx/dy — смещение от главной кнопки при раскрытии (дуга слева-сверху, безопасная для правого нижнего угла).
 * Радиус 120 при шаге 30° даёт между соседними кнопками ~62px по центрам — больше их диаметра (50px),
 * иначе кружки наезжают друг на друга (было при радиусе 80).
 */
const messengers = Object.fromEntries(MESSENGERS.map((m) => [m.id, m]));

const links = [
  { label: "Написать в WhatsApp", channel: "wa", href: messengers.wa.href, external: true, icon: messengers.wa.Icon, dx: -120, dy: 0 },
  { label: "Написать в Telegram", channel: "tg", href: messengers.tg.href, external: true, icon: messengers.tg.Icon, dx: -104, dy: -60 },
  { label: "Написать в MAX", channel: "max", href: messengers.max.href, external: true, icon: messengers.max.Icon, dx: -60, dy: -104 },
  { label: "Написать на почту", channel: "email", href: CONTACT_EMAIL_HREF, external: false, icon: MailIcon, dx: 0, dy: -120 },
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
        {attention && (
          <PointerArrowIcon className="animate-widget-arrow pointer-events-none absolute bottom-13 right-2 text-brand drop-shadow-[0_4px_10px_rgba(255,89,0,0.35)]" />
        )}

        {links.map(({ label, channel, href, external, icon: Icon, dx, dy }, i) => (
          <a
            key={label}
            href={href}
            aria-label={label}
            aria-hidden={!open}
            tabIndex={open ? 0 : -1}
            title={label}
            onClick={() => {
              reachGoal(GOALS.messengerClick, { channel, place: "widget" });
              setOpen(false);
            }}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            style={{
              transform: open ? `translate(${dx}px, ${dy}px) scale(1)` : "translate(0, 0) scale(0.3)",
              opacity: open ? 1 : 0,
              transitionDelay: open ? `${i * 40}ms` : `${(links.length - 1 - i) * 30}ms`,
            }}
            className={`absolute bottom-0 right-0 grid size-12.5 place-items-center rounded-full bg-white text-ink-900 shadow-[0_12px_28px_-8px_rgba(28,20,16,0.35)] transition-[transform,opacity] duration-300 ease-out hover:bg-brand hover:text-white ${open ? "pointer-events-auto" : "pointer-events-none"}`}
          >
            <Icon size={21} strokeWidth={1.8} />
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
            {open ? <CloseIcon size={20} /> : <ChatIcon size={24} strokeWidth={1.8} />}
          </span>
        </button>
      </div>
    </div>
  );
}
