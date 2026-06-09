/**
 * Планировщик: периодически отбирает товары, у которых истёк интервал
 * обновления по тарифу владельца, и ставит их в очереди refresh/position.
 * jobId дедуплицирует, поэтому повторные тики безопасны.
 */
import { prisma } from "@/lib/db";
import { getPlan } from "@/lib/plans";
import { enqueueRefresh, enqueuePosition } from "@/lib/queue/queues";

let running = false;

export async function enqueueDueProducts(): Promise<number> {
  if (running) return 0; // не допускаем перекрытия тиков
  running = true;
  const now = Date.now();
  let enqueued = 0;

  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        marketplace: true,
        lastCheckedAt: true,
        searchKeyword: true,
        user: {
          select: { subscription: { select: { plan: true, status: true } } },
        },
      },
    });

    for (const p of products) {
      const sub = p.user.subscription;
      const planId =
        !sub || sub.status === "CANCELED" ? "FREE" : sub.plan;
      const intervalMs = getPlan(planId).refreshIntervalMinutes * 60_000;
      const dueAt = (p.lastCheckedAt?.getTime() ?? 0) + intervalMs;

      if (now >= dueAt) {
        await enqueueRefresh(p.id, p.marketplace);
        if (p.searchKeyword) await enqueuePosition(p.id);
        enqueued++;
      }
    }
  } finally {
    running = false;
  }

  return enqueued;
}
