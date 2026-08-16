import { ErrorState } from "@/shared/ui";
import "./(app)/globals.css";

/**
 * 404 для URL, не подошедших ни одному роуту. Корневых layout-ов у проекта два —
 * `(app)` и `(payload)`, — поэтому Next рендерит этот файл без layout вообще:
 * html/body приходится описывать здесь, Header/Footer и шрифтов тут нет.
 * 404 внутри магазина (например, `notFound()` на карточке товара) обрабатывает
 * `app/(app)/not-found.tsx` — там страница уже с шапкой и подвалом.
 */
export default function NotFound() {
  return (
    <html lang="ru">
      <body>
        <main>
          <ErrorState
            title="Страница не найдена"
            description="Возможно, в ссылке опечатка или страницу переместили."
            link={{ href: "/", label: "На главную" }}
          />
        </main>
      </body>
    </html>
  );
}
