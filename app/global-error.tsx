"use client";

import "./(app)/globals.css";

/**
 * Последний рубеж: сюда попадают только ошибки самого корневого layout —
 * ни Header, ни шрифтов на этом экране уже нет, поэтому он максимально простой.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body>
        <main className="mx-auto flex min-h-screen max-w-[720px] items-center justify-center px-5 py-16">
          <div className="w-full rounded-card bg-white p-8 text-center md:p-12">
            <h1 className="text-balance font-display text-[32px] font-medium leading-[1.08] tracking-tight">
              Сайт недоступен
            </h1>
            <p className="mx-auto mt-4 max-w-[46ch] text-ink-600">
              Произошёл сбой при загрузке страницы. Попробуйте обновить — обычно это помогает.
            </p>
            <button
              onClick={reset}
              className="mt-8 cursor-pointer rounded-full bg-brand px-7 py-3.5 font-medium text-white transition-colors hover:bg-brand-dark"
            >
              Обновить страницу
            </button>
            {error.digest && (
              <p className="mt-8 text-[13px] text-ink-600">Код ошибки: {error.digest}</p>
            )}
          </div>
        </main>
      </body>
    </html>
  );
}
