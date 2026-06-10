import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/queue/connection";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Самодиагностика: статусы БД/Redis и наличие ключевых переменных (без секретов).
 */
export async function GET() {
  const checks: Record<string, string | boolean> = {
    appUrl: env.appUrl,
    databaseUrlSet: !!process.env.DATABASE_URL,
    redisUrlSet: !!process.env.REDIS_URL,
    jwtSecretSet: !!process.env.JWT_SECRET,
    encryptionKeySet: !!process.env.ENCRYPTION_KEY,
    resendKeySet: !!process.env.RESEND_API_KEY,
    telegramBotSet: !!process.env.TELEGRAM_BOT_TOKEN,
    yookassaSet: !!process.env.YOOKASSA_SHOP_ID,
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch (e) {
    checks.database = `error: ${e instanceof Error ? e.message.slice(0, 120) : "?"}`;
  }

  try {
    const pong = await Promise.race([
      redis.ping(),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout 3s")), 3000)),
    ]);
    checks.redis = pong === "PONG" ? "ok" : String(pong);
  } catch (e) {
    checks.redis = `error: ${e instanceof Error ? e.message.slice(0, 120) : "?"}`;
  }

  const healthy = checks.database === "ok" && checks.redis === "ok";
  return NextResponse.json(
    { status: healthy ? "ok" : "degraded", checks },
    { status: healthy ? 200 : 503 },
  );
}
