import { ErrorState } from "@/shared/ui";

export default function ProductNotFound() {
  return (
    <ErrorState
      title="Такого инструмента нет"
      description="Возможно, его уже купили и сняли с продажи — посмотрите, что есть в наличии сейчас."
      link={{ href: "/catalog", label: "В каталог" }}
    />
  );
}
