#!/bin/bash
# Единая точка запуска контейнера: миграции -> сид админа -> web + worker.
# Никаких команд в Railway задавать не нужно — это CMD по умолчанию.
set -e

echo "[start] Применяю миграции БД…"
pnpm exec prisma migrate deploy

echo "[start] Сид администратора (идемпотентно)…"
pnpm db:seed || echo "[start] Сид не выполнен — продолжаю без него"

echo "[start] Запускаю worker…"
pnpm worker &
WORKER_PID=$!

echo "[start] Запускаю web (Next.js)…"
pnpm start &
WEB_PID=$!

trap 'kill $WORKER_PID $WEB_PID 2>/dev/null' TERM INT

# Если любой из процессов упал — гасим контейнер, Railway перезапустит его сам.
wait -n $WORKER_PID $WEB_PID
echo "[start] Один из процессов завершился — перезапуск контейнера"
kill $WORKER_PID $WEB_PID 2>/dev/null || true
exit 1
