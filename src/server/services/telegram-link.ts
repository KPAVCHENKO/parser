/**
 * Привязка Telegram-чата к аккаунту через одноразовый код (deep-link /start).
 * Код хранится в Redis с TTL.
 */
import { redis } from "@/lib/queue/connection";
import { randomToken } from "@/lib/crypto";
import { env } from "@/lib/env";
import { ApiError } from "@/lib/errors";

const TTL_SECONDS = 900; // 15 минут
const keyFor = (code: string) => `tg:link:${code}`;

/** Создаёт код привязки и возвращает deep-link на бота. */
export async function createTelegramLink(
  userId: string,
): Promise<{ code: string; deepLink: string | null }> {
  const code = randomToken(8).replace(/[-_]/g, "").slice(0, 12);
  await redis.set(keyFor(code), userId, "EX", TTL_SECONDS);
  const deepLink = env.telegram.botUsername
    ? `https://t.me/${env.telegram.botUsername}?start=${code}`
    : null;
  return { code, deepLink };
}

/** Возвращает userId по коду и инвалидирует код. */
export async function consumeTelegramLink(
  code: string,
): Promise<string | null> {
  const key = keyFor(code);
  const userId = await redis.get(key);
  if (userId) await redis.del(key);
  return userId;
}

/** Гард: Telegram доступен на тарифах Start+. */
export function assertTelegramAllowed(features: { telegram: boolean }): void {
  if (!features.telegram) {
    throw new ApiError(
      "Telegram-уведомления доступны на тарифах Start и Pro.",
      403,
    );
  }
}
