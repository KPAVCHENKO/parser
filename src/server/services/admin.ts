/**
 * Аналитика для админки: MRR, распределение по тарифам, список пользователей.
 */
import type { Plan } from "@prisma/client";
import { prisma } from "@/lib/db";
import { planPrice } from "@/lib/plans";

export interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  payingUsers: number;
  mrr: number; // ежемесячная регулярная выручка, ₽
  byPlan: Record<Plan, number>;
}

export async function getAdminStats(): Promise<AdminStats> {
  const [totalUsers, totalProducts, subs] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.subscription.findMany({
      select: { plan: true, interval: true, status: true },
    }),
  ]);

  const byPlan: Record<Plan, number> = { FREE: 0, START: 0, PRO: 0 };
  let mrr = 0;
  let payingUsers = 0;

  for (const s of subs) {
    byPlan[s.plan] = (byPlan[s.plan] ?? 0) + 1;
    if (s.status === "ACTIVE" && s.plan !== "FREE") {
      payingUsers++;
      const price = planPrice(s.plan, s.interval);
      // Приводим к месячному эквиваленту
      mrr += s.interval === "YEAR" ? Math.round(price / 12) : price;
    }
  }

  return { totalUsers, totalProducts, payingUsers, mrr, byPlan };
}

export async function listUsersAdmin(limit = 100) {
  const users = await prisma.user.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      subscription: { select: { plan: true, status: true, currentPeriodEnd: true } },
      _count: { select: { products: true } },
    },
  });

  return users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    plan: u.subscription?.plan ?? "FREE",
    status: u.subscription?.status ?? "ACTIVE",
    products: u._count.products,
    createdAt: u.createdAt.toISOString(),
  }));
}
