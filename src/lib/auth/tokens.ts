/**
 * Одноразовые токены: magic-link, подтверждение email, сброс пароля.
 * В БД храним только SHA-256 хэш токена.
 */
import type { TokenPurpose } from "@prisma/client";
import { prisma } from "../db";
import { randomToken, sha256 } from "../crypto";

const TTL_MINUTES: Record<TokenPurpose, number> = {
  MAGIC_LINK: 15,
  EMAIL_VERIFY: 60 * 24,
  PASSWORD_RESET: 30,
};

/** Создаёт токен, возвращает исходное (нехэшированное) значение для ссылки. */
export async function issueToken(
  userId: string,
  purpose: TokenPurpose,
): Promise<string> {
  const token = randomToken();
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + TTL_MINUTES[purpose] * 60_000);

  await prisma.verificationToken.create({
    data: { userId, tokenHash, purpose, expiresAt },
  });
  return token;
}

/** Проверяет и «сжигает» токен. Возвращает userId или null. */
export async function consumeToken(
  token: string,
  purpose: TokenPurpose,
): Promise<string | null> {
  const tokenHash = sha256(token);
  const record = await prisma.verificationToken.findUnique({
    where: { tokenHash },
  });

  if (
    !record ||
    record.purpose !== purpose ||
    record.usedAt !== null ||
    record.expiresAt < new Date()
  ) {
    return null;
  }

  await prisma.verificationToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });
  return record.userId;
}
