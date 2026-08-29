"use client";

import Link from "next/link";
import { useCookieConsent } from "@/shared/lib";

export function CookieBanner() {
  const consent = useCookieConsent((s) => s.consent);
  const hydrated = useCookieConsent((s) => s.hydrated);
  const choose = useCookieConsent((s) => s.choose);

  // Пока выбор не поднят из localStorage, баннера нет: иначе он моргал бы на каждой
  // загрузке у тех, кто уже ответил.
  if (!hydrated || consent !== null) return null;

  return (
    // pointer-events-none: обёртка растянута на весь экран и иначе перехватывала бы клики по
    // виджету связи. z-30 ниже виджета (z-40) сознательно — баннер про cookie не должен
    // перекрывать связь с магазином. Диалоги (z-50) выше обоих.
    <div
      role="region"
      aria-label="Согласие на использование cookie"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-4 md:px-8"
    >
      <div className="pointer-events-auto mx-auto flex max-w-[560px] flex-col items-start gap-3 rounded-[22px] border border-ink-900/10 bg-white p-4 shadow-[0_18px_48px_-20px_rgba(28,20,16,0.35)] sm:flex-row sm:items-center">
        <p className="flex-1 text-[13px] leading-relaxed text-ink-600">
          Мы используем cookie для работы корзины и авторизации, с вашего согласия — для аналитики.{" "}
          <Link href="/cookie-policy" className="text-ink-900 underline underline-offset-2 hover:text-brand-dark">
            Политика cookie
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose("necessary")}
            className="rounded-full border border-ink-900/20 px-3.5 py-1.5 text-[13px] font-medium transition-colors hover:border-brand hover:text-brand-dark"
          >
            Только нужные
          </button>
          <button
            type="button"
            onClick={() => choose("all")}
            className="rounded-full bg-brand px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-brand-dark"
          >
            Принять все
          </button>
        </div>
      </div>
    </div>
  );
}
