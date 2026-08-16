"use client";

import { ErrorState } from "@/shared/ui";

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Кабинет не загрузился"
      description="Не получилось получить ваши заказы. Попробуйте ещё раз — данные заказа никуда не делись."
      onRetry={reset}
      link={{ href: "/", label: "На главную" }}
      digest={error.digest}
    />
  );
}
