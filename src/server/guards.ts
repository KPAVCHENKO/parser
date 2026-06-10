/**
 * Гарды тарифных лимитов — единственное место проверки ограничений по плану.
 * Роль ADMIN не ограничивается ничем.
 */
import type { Plan, Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { ApiError } from "@/lib/api";

type FeatureKey = "telegram" | "apiAccess" | "export";

interface GuardUser {
  id?: string;
  role?: Role;
  subscription?: { plan: Plan; status: string } | null;
}

function isAdmin(user: GuardUser): boolean {
  return user.role === "ADMIN";
}

export function userPlan(user: GuardUser): Plan {
  if (isAdmin(user)) return "PRO";
  const sub = user.subscription;
  // Просроченная подписка → откат на FREE-лимиты
  if (!sub || sub.status === "CANCELED") return "FREE";
  return sub.plan;
}

export async function assertCanAddProduct(
  user: GuardUser & { id: string },
): Promise<void> {
  if (isAdmin(user)) return; // админ без лимитов
  const plan = getPlan(userPlan(user));
  const count = await prisma.product.count({ where: { userId: user.id } });
  if (count >= plan.maxProducts) {
    throw new ApiError(
      `Достигнут лимит тарифа ${plan.name}: ${plan.maxProducts} товаров. Перейдите на более высокий тариф.`,
      403,
    );
  }
}

export async function assertCanAddCompetitor(
  user: GuardUser & { id: string },
  productId: string,
): Promise<void> {
  if (isAdmin(user)) return; // админ без лимитов
  const plan = getPlan(userPlan(user));
  const count = await prisma.competitor.count({ where: { productId } });
  if (count >= plan.maxCompetitorsPerProduct) {
    throw new ApiError(
      `Лимит конкурентов на товар для тарифа ${plan.name}: ${plan.maxCompetitorsPerProduct}.`,
      403,
    );
  }
}

export function assertFeature(user: GuardUser, feature: FeatureKey): void {
  if (isAdmin(user)) return; // админу доступны все фичи
  const plan = getPlan(userPlan(user));
  if (!plan.features[feature]) {
    throw new ApiError(
      `Функция доступна на более высоком тарифе (сейчас ${plan.name}).`,
      403,
    );
  }
}
