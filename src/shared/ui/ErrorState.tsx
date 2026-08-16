"use client";

import Link from "next/link";
import { SectionTitle } from "./SectionTitle";
import { ArrowButton } from "./ArrowButton";

/**
 * Общий экран «что-то пошло не так» для error.tsx / not-found.tsx.
 * `onRetry` — это `reset()` из Next-границы ошибок; в not-found его нет,
 * тогда остаётся только ссылка-выход.
 */
export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = "Попробовать снова",
  link,
  digest,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
  retryLabel?: string;
  link?: { href: string; label: string };
  digest?: string;
}) {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-[720px] items-center justify-center px-5 py-16">
      <div className="w-full rounded-card bg-white p-8 text-center md:p-12">
        <SectionTitle className="text-[32px]">{title}</SectionTitle>
        <p className="mx-auto mt-4 max-w-[46ch] text-ink-600">{description}</p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {onRetry && <ArrowButton onClick={onRetry}>{retryLabel}</ArrowButton>}
          {link && (
            <Link
              href={link.href}
              className="border-b border-ink-900/25 py-2 text-base font-medium transition-colors hover:border-brand hover:text-brand-dark"
            >
              {link.label}
            </Link>
          )}
        </div>

        {digest && <p className="mt-8 text-[13px] text-ink-600">Код ошибки: {digest}</p>}
      </div>
    </section>
  );
}
