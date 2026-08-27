import { ErrorState } from "@/shared/ui";

export default function ProductNotFound() {
  return (
    <ErrorState
      title="Такого инструмента нет"
      description="Посмотрите, что есть в наличии сейчас."
      link={{ href: "/catalog", label: "В каталог" }}
    />
  );
}
