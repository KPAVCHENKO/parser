# Единый образ для web и worker (разный CMD задаётся в compose/Railway).
FROM node:20-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# Пиним pnpm в образ, чтобы он не скачивался при каждом старте контейнера
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- Зависимости ----
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---- Сборка ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm db:generate && pnpm exec next build

# ---- Рантайм ----
FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app ./
EXPOSE 3000
# Всё в одном контейнере: миграции + сид + web + worker (см. start.sh).
CMD ["bash", "start.sh"]
