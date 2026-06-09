import IORedis from "ioredis";
import { env } from "@/lib/env";

// Единое подключение Redis для BullMQ (продюсеры и воркер).
// maxRetriesPerRequest: null — обязательное требование BullMQ.
const globalForRedis = globalThis as unknown as { redis?: IORedis };

export const redis =
  globalForRedis.redis ??
  new IORedis(env.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    // Не подключаемся при импорте модуля (важно для сборки Next без Redis) —
    // соединение устанавливается при первой команде.
    lazyConnect: true,
  });

// Без слушателя 'error' ioredis печатает "Unhandled error event".
redis.on("error", (err) => {
  if (process.env.NODE_ENV !== "production") {
    console.warn("[redis]", (err as Error).message);
  }
});

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
