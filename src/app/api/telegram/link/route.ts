import { handler, ok, authUser, ApiError } from "@/lib/api";
import { getPlan } from "@/lib/plans";
import {
  createTelegramLink,
  assertTelegramAllowed,
} from "@/server/services/telegram-link";

export const POST = handler(async () => {
  const user = await authUser();
  const plan = getPlan(user.subscription?.plan ?? "FREE");
  assertTelegramAllowed(plan.features);

  const link = await createTelegramLink(user.id);
  if (!link.deepLink) {
    throw new ApiError("Telegram-бот не настроен (TELEGRAM_BOT_USERNAME)", 503);
  }
  return ok(link);
});
