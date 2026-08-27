# Omnia

Интернет-магазин хангов ручной работы. Next.js 16 (App Router) + Tailwind v4 + Payload CMS + FSD.

## Разработка

```bash
npm install
cp .env.example .env.local   # заполнить DATABASE_URL, SMS_RU_API_ID и остальное
docker compose up -d db      # Postgres на 5433
npm run auth:migrate         # один раз на новой базе — таблицы Better Auth
npm run dev                  # http://localhost:3000
```

## Проверки

```bash
npm run build      # типы + сборка
npm run lint       # в гейте гоняется с --max-warnings=0
npm run test:e2e   # Playwright, нужен запущенный Postgres
```

E2E поднимает приложение целиком со своей базой и заглушками вместо SMS.ru, ЮKassa и СДЭК —
внешние сервисы во время прогона не дёргаются.

## Деплой

Пуш в `main` выкатывает на прод автоматически (`.github/workflows/deploy.yml`): сначала
прогоняется весь набор E2E, и только потом собирается образ. Красные тесты выкатку
останавливают. На сервере — Docker Compose с Caddy, TLS выписывается автоматически.

Контекст проекта, архитектура и roadmap — в [CLAUDE.md](./CLAUDE.md).
