import { handler, parseBody, created, ApiError } from "@/lib/api";
import { registerSchema } from "@/lib/auth/validation";
import { hashPassword } from "@/lib/auth/password";
import { createUser, findUserByEmail } from "@/server/services/users";
import { createSession } from "@/lib/auth/session";
import { issueToken } from "@/lib/auth/tokens";
import { sendMail, welcomeEmail } from "@/lib/notifications/email";
import { env } from "@/lib/env";

export const POST = handler(async (req) => {
  const input = await parseBody(req, registerSchema);

  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new ApiError("Пользователь с таким email уже существует", 409);
  }

  const passwordHash = await hashPassword(input.password);
  const user = await createUser({
    email: input.email,
    passwordHash,
    name: input.name,
    referredByCode: input.ref,
  });

  // Письмо с подтверждением email (не блокирует регистрацию)
  const token = await issueToken(user.id, "EMAIL_VERIFY");
  const verifyUrl = `${env.appUrl}/api/auth/verify-email?token=${token}`;
  void sendMail({ to: user.email, ...welcomeEmail(verifyUrl) });

  await createSession({ sub: user.id, email: user.email, role: user.role });

  return created({
    id: user.id,
    email: user.email,
    name: user.name,
    referralCode: user.referralCode,
  });
});
