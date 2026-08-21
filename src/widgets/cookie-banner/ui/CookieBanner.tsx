"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { COOKIE_CONSENT_KEY, type CookieConsent } from "@/shared/lib";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.localStorage.getItem(COOKIE_CONSENT_KEY)) setVisible(true);
  }, []);

  function choose(consent: CookieConsent) {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, consent);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    // pointer-events-none на обёртке: она растянута на всю ширину экрана и без этого
    // прозрачными полями по бокам карточки перехватывала бы клики по виджету связи (z-40).
    <div
      role="region"
      aria-label="Согласие на использование cookie"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-5 pb-5 md:px-8"
    >
      <div className="pointer-events-auto mx-auto flex max-w-[820px] flex-col items-start gap-4 rounded-card border border-ink-900/10 bg-white p-6 shadow-[0_24px_64px_-24px_rgba(28,20,16,0.35)] sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-ink-600">
          Мы используем файлы cookie, необходимые для работы корзины и авторизации.
          С вашего согласия — также для аналитики посещений. Подробнее —{" "}
          <Link href="/cookie-policy" className="text-ink-900 underline underline-offset-2 hover:text-brand-dark">
            политика cookie
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => choose("necessary")}
            className="rounded-full border border-ink-900/20 px-5 py-2.5 text-sm font-medium transition-colors hover:border-brand hover:text-brand-dark"
          >
            Только необходимые
          </button>
          <button
            type="button"
            onClick={() => choose("all")}
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
          >
            Принять все
          </button>
        </div>
      </div>
    </div>
  );
}
