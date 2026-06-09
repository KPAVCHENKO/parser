import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { consumeTelegramLink } from "@/server/services/telegram-link";
import { sendTelegramMessage } from "@/lib/notifications/telegram";

interface TgUpdate {
  message?: {
    text?: string;
    chat?: { id?: number };
  };
}

/**
 * Webhook Telegram-бота. Подлинность апдейта подтверждаем секретным заголовком
 * X-Telegram-Bot-Api-Secret-Token, который задаётся при установке вебхука.
 */
export async function POST(req: Request) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (
    env.telegram.webhookSecret &&
    secret !== env.telegram.webhookSecret
  ) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: TgUpdate;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const text = update.message?.text?.trim();
  const chatId = update.message?.chat?.id;
  if (!text || chatId === undefined) return NextResponse.json({ ok: true });

  if (text.startsWith("/start")) {
    const code = text.split(/\s+/)[1];
    if (!code) {
      await sendTelegramMessage(
        String(chatId),
        "Привет! Чтобы подключить уведомления MarketPulse, откройте раздел «Настройки» в личном кабинете и нажмите «Подключить Telegram».",
      );
      return NextResponse.json({ ok: true });
    }

    const userId = await consumeTelegramLink(code);
    if (!userId) {
      await sendTelegramMessage(
        String(chatId),
        "Ссылка устарела или недействительна. Сгенерируйте новую в настройках MarketPulse.",
      );
      return NextResponse.json({ ok: true });
    }

    // Привязываем чат; снимаем привязку с других аккаунтов на всякий случай
    await prisma.user.updateMany({
      where: { telegramChatId: String(chatId) },
      data: { telegramChatId: null },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { telegramChatId: String(chatId) },
    });

    await sendTelegramMessage(
      String(chatId),
      "✅ Telegram подключён! Теперь вы будете получать уведомления MarketPulse: падение цен конкурентов, остатки и изменения позиций.",
    );
  }

  return NextResponse.json({ ok: true });
}
