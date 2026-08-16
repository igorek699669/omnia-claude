"use client";

import { ErrorState } from "@/shared/ui";

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Инструмент не открылся"
      description="Не получилось загрузить карточку. Попробуйте ещё раз или вернитесь в каталог."
      onRetry={reset}
      link={{ href: "/catalog", label: "В каталог" }}
      digest={error.digest}
    />
  );
}
