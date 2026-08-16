"use client";

import { ErrorState } from "@/shared/ui";

export default function CatalogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Каталог не загрузился"
      description="Не получилось получить список инструментов. Попробуйте ещё раз или сбросьте фильтры."
      onRetry={reset}
      link={{ href: "/catalog", label: "Сбросить фильтры" }}
      digest={error.digest}
    />
  );
}
