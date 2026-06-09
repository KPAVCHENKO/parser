/**
 * Гарды тарифных лимитов — единственное место проверки ограничений по плану.
 */
import type { Plan } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { ApiError } from "@/lib/api";

type FeatureKey = "telegram" | "apiAccess" | "export";

export function userPlan(user: {
  subscription?: { plan: Plan; status: string } | null;
}): Plan {
  const sub = user.subscription;
  // Просроченная подписка → откат на FREE-лимиты
  if (!sub || sub.status === "CANCELED") return "FREE";
  return sub.plan;
}

export async function assertCanAddProduct(user: {
  id: string;
  subscription?: { plan: Plan; status: string } | null;
}): Promise<void> {
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
  user: { id: string; subscription?: { plan: Plan; status: string } | null },
  productId: string,
): Promise<void> {
  const plan = getPlan(userPlan(user));
  const count = await prisma.competitor.count({ where: { productId } });
  if (count >= plan.maxCompetitorsPerProduct) {
    throw new ApiError(
      `Лимит конкурентов на товар для тарифа ${plan.name}: ${plan.maxCompetitorsPerProduct}.`,
      403,
    );
  }
}

export function assertFeature(
  user: { subscription?: { plan: Plan; status: string } | null },
  feature: FeatureKey,
): void {
  const plan = getPlan(userPlan(user));
  if (!plan.features[feature]) {
    throw new ApiError(
      `Функция доступна на более высоком тарифе (сейчас ${plan.name}).`,
      403,
    );
  }
}
