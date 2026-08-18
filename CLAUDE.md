# Omnia — интернет-магазин хангов

Магазин хангов (handpan), глюкофонов, RAV-драмов и комплектующих. На старте продаются только ханги. Владелец проекта — фронтенд-разработчик (React/TypeScript), проект соло.

## Стек (зафиксировано, не менять без обсуждения)

- **Next.js 15, App Router, TypeScript** — фронт и серверный слой (Route Handlers + Server Actions). Отдельного бэкенда (Nest) нет и не нужно.
- **Tailwind CSS v4** — токены в `@theme` в `app/globals.css`. Без CSS-in-JS.
- **Zustand** — только корзина (`src/features/cart/model/store.ts`, persist в localStorage). Не добавлять глобальные сторы без необходимости.
- **React Query** — используется точечно, только для клиентских мутаций с состояниями loading/error (например `emailOtp.sendVerificationOtp`/`signIn.emailOtp` в `AuthPage`), через `useMutation`. `QueryClientProvider` подключён в `app/layout.tsx` (`src/shared/lib/query-provider.tsx`). Не заводить под него `useQuery` для данных, которые и так read-only и тянутся в Server Components — там он не нужен.
- **React Hook Form + Zod** — формы (зависимости уже в package.json).
- **react-hot-toast** — единый канал уведомлений об успехе/ошибке пользовательских действий (добавление в корзину, отправка/проверка OTP-кода, выход из аккаунта). `<Toaster />` подключён в `app/layout.tsx` со стилями под тему проекта. Не дублировать тостом ошибки валидации формы (React Hook Form/Zod) — они остаются инлайн под полем, тост — только для результата сетевого действия/мутации.
- **Radix UI** — headless-примитивы для интерактивных контролов, ради клавиатурной доступности (Tab/стрелки/Escape). Обёрнуты в `src/shared/ui`: `Checkbox`, `RadioGroup`/`RadioChip`, `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`, `Accordion`/`AccordionItem`/`AccordionTrigger`/`AccordionContent`, `Select`/`SelectTrigger`/`SelectContent`/`SelectItem`, `Dialog`/`DialogTrigger`/`DialogTitle`/`DialogClose`/`DialogContent`. Использовать их вместо самодельных чекбоксов/табов/аккордеонов/дропдаунов везде, где нужна семантика реального интерактивного контрола (не для нативных `<input>`/`<select>`, у которых уже отличная клавиатурная поддержка "из коробки", — там Radix не даёт выигрыша).
- **Better Auth, email OTP** — подключено раньше остального Roadmap (см. ниже), опережая порядок. Конфиг сервера — `auth.ts` в корне (бэкенд, не FSD, как и будущий `payload/`), клиент — `src/shared/lib/auth-client.ts` (`authClient`, `useSession`, `signOut`). Код отправляется через SMTP (`nodemailer`, настройки в `.env.local`). Своя таблица пользователей в Postgres — при появлении Payload админы останутся в его собственной auth, не смешивать.
- Планируются (см. Roadmap): **Payload CMS 3.x + PostgreSQL** (сейчас Postgres используется только под Better Auth, без Payload), **ЮKassa**, **СДЭК API**, **next-intl**, **Motion**.

## Архитектура: Feature-Sliced Design

`app/` — ТОЛЬКО тонкий роутинг Next.js: каждый `page.tsx` — одна строка re-export из `src/pages`. Всю логику и разметку класть в `src/`:

- `src/pages/` — страницы (стандартный FSD-слой `pages`). Пустая папка `pages/` в корне проекта (рядом с `app/`, вне `src/`) — не удалять: без неё Next.js начинает сканировать `src/pages` как корень своего Pages Router и ломает сборку. Схема — по официальному гайду [FSD + Next.js](https://feature-sliced.design/ru/docs/guides/tech/with-nextjs).
- `src/widgets/` — крупные составные блоки (Header, Footer)
- `src/features/` — пользовательские сценарии (cart, позже auth-otp, select-delivery)
- `src/entities/` — доменные сущности (product; позже order, user)
- `src/shared/` — UI-кит, утилиты, API-клиенты

Правила: импорты только сверху вниз (pages → widgets → features → entities → shared). Каждый слайс экспортируется через `index.ts` (public API). Payload-конфиг, когда появится, живёт в `payload/` в корне — это бэкенд, не FSD.

Внутри `ui/` слайса-страницы: сам компонент страницы (`HomePage.tsx`, `CheckoutPage.tsx` и т.п.) лежит прямо в `ui/`, а компоненты, которые использует только эта страница (секции, шаги, локальные виджеты), — в `ui/components/`. Не складывать их в одну кучу. Если у страницы всего один файл — подпапка `components/` не нужна.

## Дизайн-система

Визуальный референс — `docs/prototype.html` (согласованный HTML-прототип главной, открой в браузере). При сомнениях в верстке сверяться с ним.

Токены (уже в `app/globals.css` → `@theme`):
- Цвета: `brand #FF5900`, `brand-dark #E04E00` (hover), фоны `paper-50 #F6F4F1` / `paper-100 #EFECE6` / `paper-200 #E7E1D8` (тёплый серо-бумажный, БЕЗ розового подтона), текст `ink-900 #1C1410` (тёплый чёрный, не #000), приглушённый `ink-600 #6F6259`.
- Шрифты: заголовки **Jost** (`font-display`), текст **Golos Text** (`font-body`). Подключены через next/font в `app/layout.tsx`. НЕ использовать серифы — вариант с Cormorant был отвергнут.
- Радиусы: карточки/секции `40px` (`rounded-card`), кнопки — пилюли (`rounded-full`), инпуты `16px` (`rounded-input`).
- Line-height: заголовки ~1.05, боди-текст 1.5–1.6 (в макете Figma 1.1 — сознательно исправлено).
- Кнопка-пилюля со стрелкой в круге — `ArrowButton`/`ArrowLink` из `src/shared/ui`.

UX-решения (согласованы, не откатывать):
- Преимущества в hero — статичный блок НАД заголовком (не слайдер).
- Карточка товара: медиа-слайдер с точками, ПЕРВЫЙ слайд — видео; чип «Поиграть на ханге» — это аудиоплеер (`AudioPlayerChip` из `src/shared/ui`), включает запись реального строя (`product.audioSample`, файл в `public/audio/`); иконки Telegram/WhatsApp; цена со старой зачёркнутой; строка параметров (ноты · вес · диаметр · материал). На странице товара — `AudioPlayerBar` (плеер с перемоткой) поверх медиа-блока.
- Секция доставки: на десктопе шаги кликабельны и переключают картинку; на мобиле (<lg) переключений НЕТ — у каждого шага своя статичная картинка. Скрытая интерактивность на таче запрещена.
- CTA-блок «Остались вопросы?» — спокойный фон paper-200, оранжевая только кнопка (не заливать оранжевым).

## Figma

Файл: https://www.figma.com/design/hZryNrh5hn5D0aepXubsaV/Omnia-Website
Содержит: главная (1440/768/375), футер, бургер-меню (гость/авторизованный), флоу авторизации (Авторизация → Ввод кода → Код введён → Ошибка кода) в двух брейкпоинтах, страница «Доставка». В файле есть секция «🚀 Redesign v2» и коллекция переменных Tokens v2 (создана автоматически, палитра там устаревшая — источник истины теперь `globals.css`).
Figma MCP на Starter-плане быстро упирается в лимит вызовов — фотографии экспортировать руками в `public/` и подключать через `next/image`.

## Заглушки, которые нужно заменить

- `HandpanArt` (src/shared/ui) — SVG-заглушка ханга. Заменить на реальные фото (экспорт из Figma / съёмка) через `next/image`.
- Градиентные фоны в DeliverySteps и Faq — заменить на фото процесса упаковки и мастерской.
- `entities/product/api/mock.ts` — мок-каталог. Заменить на Payload Local API.
- Фото товара в заказах ProfilePage и в корзине — та же заглушка `HandpanArt`: у `Product` нет поля с медиа, `media[]` из Payload наружу пока не проброшено.
- Ссылка ВКонтакте в футере (`#`) — плейсхолдер, аккаунта пока нет.

## Контакты

Единый источник — `src/shared/lib/contacts.ts` (телефон, email, Telegram, WhatsApp, MAX). Не хардкодить номер/почту/ссылки в компонентах — импортировать константы оттуда. Плавающий виджет связи (WhatsApp/Telegram/MAX/почта) — `src/widgets/contact-widget`, подключён глобально в `app/(app)/layout.tsx`, фиксирован в правом нижнем углу поверх контента.

## Roadmap (порядок согласован)

1. **Payload CMS 3.x + Postgres** — встроить в это же Next-приложение (`payload/` в корне). Коллекции: `products` (name, slug, scaleNotes, price, oldPrice, notesCount, tuningHz, inStock, media[], video), `orders`, `categories`, `media`. У полей контента включать `localized: true` (задел под i18n). Заменить mock.ts на Local API (без HTTP).
2. **Better Auth, email OTP** — ✅ подключено (`auth.ts`, плагин `emailOTP`, SMTP через `nodemailer`). Когда появится Payload (шаг 1), `orders.customerId` будет ссылаться на Better Auth user; админы — в родной auth Payload, не смешивать. Телефонный вход (SMS/Flash Call) — отложен: в РФ SMS платные, добавить позже плагином `phoneNumber`.
3. **ЮKassa** — Server Action создаёт заказ (pending) → создание платежа → redirect → вебхук `payment.succeeded` в `app/api/webhooks/yookassa` (проверка подписи, идемпотентность, сумма проверяется на сервере).
4. **СДЭК API v2** — калькулятор тарифа и виджет выбора ПВЗ на чекауте ✅; регистрация отправления после оплаты ✅ (`registerCdekShipment` в `src/features/checkout/api/shipment.ts`, вызывается из вебхука ЮKassa, а не из `afterChange` Payload: заказ должен уезжать в СДЭК ровно по факту оплаты, а не на любое изменение документа). Осталось: вебхуки статусов + fallback-поллинг, показ статуса и трека в профиле.
   - `delivery.tariffCode`/`cityCode` сохраняются в заказе на чекауте — отправление регистрируется ровно по тому тарифу, по которому покупателю посчитали цену.
   - Номер накладной (`cdekNumber`) присваивается асинхронно и на тестовом контуре обычно не приходит вовсе — для досинхронизации есть `syncCdekOrderNumber`.
   - Серверная часть слайса лежит в `src/features/checkout/server.ts`, а не в `index.ts`: тот импортируют клиентские компоненты, и Payload утащил бы `node:fs` в браузерный бандл.
   - ⚠️ Пока `CDEK_API_URL` указывает на `api.edu.cdek.ru` с тестовым аккаунтом из документации, заказы уходят в общую песочницу СДЭК и в личном кабинете `lk.cdek.ru` не видны. Это ожидаемо — для боевых заказов нужны свой договор, свои `CDEK_ACCOUNT`/`CDEK_SECURE_PASSWORD` и `https://api.cdek.ru/v2`.
5. **next-intl** — роутинг `/ru` `/en`, запуск только с ru. Строки выносить в словари сразу.
6. **Motion** — появление секций, ховеры. Уважать `prefers-reduced-motion`.
7. SEO: Metadata API везде, JSON-LD Product, `sitemap.ts` из Payload, OG-изображения. Аналитика: Яндекс.Метрика.

## Команды

```bash
npm install        # первый запуск
cp .env.example .env.local   # заполнить DATABASE_URL и SMTP_* — см. описания в файле
npm run auth:migrate  # один раз после того, как DATABASE_URL указывает на реальный Postgres — создаёт таблицы Better Auth
npm run dev        # http://localhost:3000
npm run build      # проверка типов + сборка
```

Без `DATABASE_URL`/SMTP-переменных в `.env.local` сайт работает, но `/auth` не сможет отправить код (Better Auth падает на подключении к БД). `BETTER_AUTH_SECRET` уже сгенерирован в `.env.local` — трогать не нужно, только `DATABASE_URL` и `SMTP_*`.

## Конвенции

- Язык интерфейса и коммуникации — русский. Валюта — ₽ через `formatPrice` (src/shared/lib/format.ts).
- Server Components по умолчанию; `"use client"` — только там, где есть состояние/события.
- Не выдумывать характеристики инструментов: `notesCount` реалистично 8–22 (для строёв с нижними нотами — «10+3» и т.п. из имени аудиофайла — это сумма верхних и нижних, см. `payload/seed.ts`). Диаметр (53 см + 3 см окантовка), вес (3800 г) и материал (нержавеющая сталь Ember) одинаковы для всех хангов — захардкожены как константы в `src/entities/product/model/constants.ts`, не поля Payload.
- Доступность: aria-label на иконочных кнопках, `prefers-reduced-motion` для анимаций, фокус-стили не убирать.
