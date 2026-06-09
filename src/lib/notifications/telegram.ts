/**
 * Отправка сообщений через Telegram Bot API.
 * Привязка чата и обработка вебхука бота — на этапе 6.
 */
import { env } from "../env";

const API = "https://api.telegram.org";

export async function sendTelegramMessage(
  chatId: string | null | undefined,
  text: string,
): Promise<boolean> {
  if (!env.telegram.botToken) {
    console.info(`[telegram:dev] -> ${chatId ?? "?"}: ${text}`);
    return true;
  }
  if (!chatId) return false;

  try {
    const res = await fetch(`${API}/bot${env.telegram.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("[telegram] Ошибка отправки:", err);
    return false;
  }
}
