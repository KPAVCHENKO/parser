import type { Prisma, User } from "@prisma/client";
import { prisma } from "@/lib/db";
import { randomToken } from "@/lib/crypto";
import { REFERRAL_BONUS_DAYS } from "@/lib/plans";

/** Генерирует уникальный реферальный код. */
async function generateReferralCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = randomToken(6).replace(/[-_]/g, "").slice(0, 8).toUpperCase();
    const exists = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!exists) return code;
  }
  return randomToken(8).toUpperCase();
}

export interface CreateUserInput {
  email: string;
  passwordHash?: string;
  name?: string;
  emailVerified?: boolean;
  referredByCode?: string;
}

/**
 * Создаёт пользователя + Free-подписку. Учитывает реферальный код:
 * начисляет бонусные дни новому пользователю и пригласившему.
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  const referralCode = await generateReferralCode();

  let referredBy: User | null = null;
  if (input.referredByCode) {
    referredBy = await prisma.user.findUnique({
      where: { referralCode: input.referredByCode.toUpperCase() },
    });
  }

  const data: Prisma.UserCreateInput = {
    email: input.email.toLowerCase(),
    passwordHash: input.passwordHash,
    name: input.name,
    referralCode,
    apiKey: `mp_${randomToken(24)}`,
    emailVerified: input.emailVerified ? new Date() : null,
    referralCreditDays: referredBy ? REFERRAL_BONUS_DAYS : 0,
    subscription: { create: { plan: "FREE", status: "ACTIVE" } },
  };

  if (referredBy) {
    data.referredBy = { connect: { id: referredBy.id } };
  }

  const user = await prisma.user.create({ data });

  // Бонус пригласившему
  if (referredBy) {
    await prisma.user.update({
      where: { id: referredBy.id },
      data: { referralCreditDays: { increment: REFERRAL_BONUS_DAYS } },
    });
  }

  return user;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}
