import { handler, parseBody, ok } from "@/lib/api";
import { magicLinkSchema } from "@/lib/auth/validation";
import { findUserByEmail, createUser } from "@/server/services/users";
import { issueToken } from "@/lib/auth/tokens";
import { sendMail, magicLinkEmail } from "@/lib/notifications/email";
import { env } from "@/lib/env";

export const POST = handler(async (req) => {
  const input = await parseBody(req, magicLinkSchema);

  // Создаём пользователя на лету, если его нет (passwordless onboarding)
  let user = await findUserByEmail(input.email);
  if (!user) {
    user = await createUser({ email: input.email, referredByCode: input.ref });
  }

  const token = await issueToken(user.id, "MAGIC_LINK");
  const url = `${env.appUrl}/api/auth/magic-link/verify?token=${token}`;
  void sendMail({ to: user.email, ...magicLinkEmail(url) });

  // Всегда одинаковый ответ — не раскрываем наличие аккаунта
  return ok({ sent: true });
});
