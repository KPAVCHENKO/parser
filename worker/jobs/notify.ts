/**
 * Обработчик отправки уведомления по выбранным каналам (email/Telegram).
 * Учитывает тариф: Telegram доступен на Start+ (иначе канал пропускается).
 */
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/notifications/email";
import { sendTelegramMessage } from "@/lib/notifications/telegram";
import { getPlan } from "@/lib/plans";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function processNotification(notificationId: string): Promise<void> {
  const n = await prisma.notification.findUnique({
    where: { id: notificationId },
    include: { user: { include: { subscription: true } } },
  });
  if (!n || n.status === "SENT") return;

  const plan = getPlan(n.user.subscription?.plan ?? "FREE");
  const wantsEmail = n.channel === "EMAIL" || n.channel === "BOTH";
  const wantsTelegram =
    (n.channel === "TELEGRAM" || n.channel === "BOTH") && plan.features.telegram;

  let delivered = false;

  if (wantsEmail && n.user.email) {
    const okEmail = await sendMail({
      to: n.user.email,
      subject: `MarketPulse: ${n.title}`,
      html: `<p><b>${escapeHtml(n.title)}</b></p><p>${escapeHtml(n.message)}</p>`,
      text: `${n.title}\n${n.message}`,
    });
    delivered = delivered || okEmail;
  }

  if (wantsTelegram && n.user.telegramChatId) {
    const okTg = await sendTelegramMessage(
      n.user.telegramChatId,
      `<b>${escapeHtml(n.title)}</b>\n${escapeHtml(n.message)}`,
    );
    delivered = delivered || okTg;
  }

  await prisma.notification.update({
    where: { id: n.id },
    data: { status: delivered ? "SENT" : "FAILED" },
  });
}
