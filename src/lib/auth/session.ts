import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "../db";
import {
  signSession,
  verifySession,
  SESSION_COOKIE,
  type SessionPayload,
} from "./jwt";

export { SESSION_COOKIE };
const MAX_AGE = 60 * 60 * 24 * 30; // 30 дней

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await signSession(payload);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function destroySession(): void {
  cookies().delete(SESSION_COOKIE);
}

/** Полезная нагрузка сессии из cookie (без обращения к БД) */
export const getSessionPayload = cache(
  async (): Promise<SessionPayload | null> => {
    const token = cookies().get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return verifySession(token);
  },
);

/** Текущий пользователь из БД (или null). Кэшируется в пределах запроса. */
export const getCurrentUser = cache(async () => {
  const payload = await getSessionPayload();
  if (!payload) return null;
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { subscription: true },
  });
  return user;
});

/** Требует авторизации, иначе бросает (для server actions / route handlers). */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
