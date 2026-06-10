# MarketPulse

SaaS для селлеров: мониторинг **цен, остатков и позиций** товаров на **Wildberries** и **Ozon**. Графики динамики, сравнение с конкурентами, уведомления в Telegram и email, выгрузка в Excel/CSV, биллинг через ЮKassa.

## Возможности

- Регистрация: email + пароль, **magic-link**, JWT-сессии (httpOnly cookie).
- Добавление товаров по ссылке/артикулу с **живым превью карточки** (WB/Ozon).
- Фоновый сбор данных по расписанию тарифа: цены, остатки, позиции в поиске.
- Графики 7/30/90 дней, до 5 конкурентов на товар.
- Алерты: падение цены конкурента, товар закончился, сдвиг позиции — в Telegram/email.
- Биллинг ЮKassa: рекуррентные платежи, годовая оплата −20%, реферальная программа.
- Экспорт в `.xlsx` и `.csv` (тариф Pro), публичный API `/api/v1` (Pro).
- Лендинг с SEO/OG, оферта и политика ПДн, админка (MRR, пользователи).

## Стек

Next.js 14 (App Router) · TypeScript · Tailwind + shadcn/ui · Recharts · Prisma · PostgreSQL · BullMQ + Redis · Vitest.

## Архитектура

```
Next.js (web + API)  ──enqueue──▶  Worker (BullMQ)
        │                              │
        └──────── Prisma ──────────────┤
                  PostgreSQL           ├─▶ Адаптеры WB/Ozon ─▶ внешние API
                  Redis (очереди/кэш)  ┘
```

Чистое разделение: `src/adapters` (маркетплейсы) → `src/server/services` (бизнес-логика) → `src/app/api` (HTTP) и `worker/` (фон). Адаптеры не знают про БД.

## Локальный запуск (Docker Compose)

```bash
cp .env.example .env   # заполните секреты (см. ниже)
docker compose up --build
# web:   http://localhost:3000
# Миграции применяются автоматически при старте web-сервиса.
```

Создать администратора для входа в `/admin`:

```bash
docker compose exec app pnpm db:seed
# по умолчанию admin@marketpulse.local / admin12345 (можно задать SEED_ADMIN_*)
```

## Локальный запуск без Docker

Нужны запущенные PostgreSQL и Redis. Затем:

```bash
pnpm install
pnpm db:deploy        # применить миграции
pnpm db:seed          # (опционально) админ
pnpm dev              # web на :3000
pnpm worker:dev       # воркер в отдельном терминале
pnpm test             # тесты бизнес-логики
```

## Переменные окружения

См. `.env.example`. Ключевые:

| Переменная | Назначение |
|---|---|
| `DATABASE_URL` | PostgreSQL |
| `REDIS_URL` | Redis (очереди, кэш) |
| `JWT_SECRET` | подпись сессий (`openssl rand -base64 48`) |
| `ENCRYPTION_KEY` | шифрование токенов маркетплейсов, 32 байта hex (`openssl rand -hex 32`) |
| `RESEND_API_KEY`, `EMAIL_FROM` | отправка email (Resend) |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET` | Telegram-бот |
| `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY` | биллинг |
| `LEGAL_ENTITY_NAME`, `LEGAL_INN`, `LEGAL_EMAIL`, `LEGAL_ADDRESS` | реквизиты для оферты/политики |

## Деплой на Railway

Нужно всего **3 сервиса**, никаких start-команд задавать не требуется:

1. **PostgreSQL** — плагин Railway (даёт `DATABASE_URL`).
2. **Redis** — плагин Railway (даёт `REDIS_URL`).
3. **app** — деплой из этого GitHub-репозитория (Dockerfile). Контейнер сам
   применяет миграции, создаёт администратора и запускает web + worker
   (см. `start.sh`). Привяжите публичный домен (порт 3000).

Переменные сервиса app: `DATABASE_URL=${{Postgres.DATABASE_URL}}`,
`REDIS_URL=${{Redis.REDIS_URL}}`, `JWT_SECRET`, `ENCRYPTION_KEY`,
`APP_URL` (публичный домен), `PORT=3000` и остальные секреты по необходимости.

### Webhooks после деплоя

- **ЮKassa**: в ЛК укажите URL уведомлений `https://<домен>/api/billing/webhook`
  (события `payment.succeeded`, `payment.canceled`).
- **Telegram**: установите вебхук бота:
  ```bash
  curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<домен>/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>"
  ```

## Тесты

```bash
pnpm test
```

Покрыты: тарифные лимиты, парсинг ответов WB/Ozon, логика срабатывания алертов.

## Источники данных и право

Используются официальные API и публичные данные карточек. Обхода капчи и защит
площадок нет. Для точных данных Ozon обязателен Client-Id/Api-Key селлера; для
расширенной статистики WB — токен селлера.
