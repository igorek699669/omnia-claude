import { ErrorState } from "@/shared/ui";
import "./(app)/globals.css";

/**
 * 404 для URL, не подошедших ни одному роуту. Корневых layout-ов два — `(app)` и
 * `(payload)`, — поэтому Next рендерит этот файл без layout вообще: html/body описываем
 * здесь, шапки и шрифтов тут нет. 404 внутри магазина — в `app/(app)/not-found.tsx`.
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
