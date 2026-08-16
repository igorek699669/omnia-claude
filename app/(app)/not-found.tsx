import { ErrorState } from "@/shared/ui";

export default function NotFound() {
  return (
    <ErrorState
      title="Страница не найдена"
      description="Возможно, в ссылке опечатка или страницу переместили."
      link={{ href: "/", label: "На главную" }}
    />
  );
}
