"use client";

import { ErrorState } from "@/shared/ui";

/** Общая граница ошибок для всех страниц магазина, у которых нет своей. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Что-то пошло не так"
      description="Страница не открылась. Попробуйте ещё раз — обычно это временный сбой."
      onRetry={reset}
      link={{ href: "/", label: "На главную" }}
      digest={error.digest}
    />
  );
}
