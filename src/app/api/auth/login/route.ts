import { handler, parseBody, ok, ApiError } from "@/lib/api";
import { loginSchema } from "@/lib/auth/validation";
import { verifyPassword } from "@/lib/auth/password";
import { findUserByEmail } from "@/server/services/users";
import { createSession } from "@/lib/auth/session";

export const POST = handler(async (req) => {
  const input = await parseBody(req, loginSchema);

  const user = await findUserByEmail(input.email);
  // Единое сообщение, чтобы не раскрывать существование аккаунта
  const invalid = new ApiError("Неверный email или пароль", 401);

  if (!user || !user.passwordHash) throw invalid;
  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) throw invalid;

  await createSession({ sub: user.id, email: user.email, role: user.role });
  return ok({ id: user.id, email: user.email, name: user.name });
});
