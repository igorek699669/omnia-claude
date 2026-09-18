"use client";

import Link from "next/link";
import { useCookieNotice } from "@/shared/lib";

export function CookieBanner() {
  const acknowledged = useCookieNotice((s) => s.acknowledged);
  const hydrated = useCookieNotice((s) => s.hydrated);
  const acknowledge = useCookieNotice((s) => s.acknowledge);

  // Пока ответ не поднят из localStorage, плашки нет: иначе она моргала бы на каждой
  // загрузке у тех, кто её уже закрыл.
  if (!hydrated || acknowledged) return null;

  return (
    // pointer-events-none: обёртка растянута на весь экран и иначе перехватывала бы клики по
    // виджету связи. z-30 ниже виджета (z-40) сознательно — плашка про cookie не должна
    // перекрывать связь с магазином. Диалоги (z-50) выше обоих.
    <div
      role="region"
      aria-label="Уведомление об использовании cookie"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-4 md:px-8"
    >
      <div className="pointer-events-auto mx-auto flex max-w-[560px] flex-col items-start gap-3 rounded-[22px] border border-ink-900/10 bg-white p-4 shadow-[0_18px_48px_-20px_rgba(28,20,16,0.35)] sm:flex-row sm:items-center">
        <p className="flex-1 text-[13px] leading-relaxed text-ink-600">
          Мы используем cookie для работы корзины, авторизации и аналитики посещений.
          Продолжая пользоваться сайтом, вы соглашаетесь с{" "}
          <Link href="/cookie-policy" className="text-ink-900 underline underline-offset-2 hover:text-brand-dark">
            политикой cookie
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={acknowledge}
          className="shrink-0 rounded-full bg-brand px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-brand-dark"
        >
          Понятно
        </button>
      </div>
    </div>
  );
}
