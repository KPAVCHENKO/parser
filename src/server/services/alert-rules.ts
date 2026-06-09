import type { AlertType, NotificationChannel } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/errors";

export interface AlertRuleInput {
  type: AlertType;
  thresholdValue?: number | null;
  channel: NotificationChannel;
  productId?: string | null;
}

async function assertProductOwned(
  userId: string,
  productId?: string | null,
): Promise<void> {
  if (!productId) return;
  const p = await prisma.product.findFirst({
    where: { id: productId, userId },
    select: { id: true },
  });
  if (!p) throw new ApiError("Товар не найден", 404);
}

export async function listAlertRules(userId: string) {
  return prisma.alertRule.findMany({
    where: { userId },
    include: { product: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createAlertRule(userId: string, input: AlertRuleInput) {
  await assertProductOwned(userId, input.productId);
  return prisma.alertRule.create({
    data: {
      userId,
      type: input.type,
      thresholdValue: input.thresholdValue ?? null,
      channel: input.channel,
      productId: input.productId ?? null,
    },
  });
}

export async function updateAlertRule(
  userId: string,
  id: string,
  input: Partial<Pick<AlertRuleInput, "thresholdValue" | "channel">> & {
    isActive?: boolean;
  },
) {
  const existing = await prisma.alertRule.findFirst({ where: { id, userId } });
  if (!existing) throw new ApiError("Правило не найдено", 404);
  return prisma.alertRule.update({
    where: { id },
    data: {
      thresholdValue: input.thresholdValue,
      channel: input.channel,
      isActive: input.isActive,
    },
  });
}

export async function deleteAlertRule(userId: string, id: string) {
  const res = await prisma.alertRule.deleteMany({ where: { id, userId } });
  if (res.count === 0) throw new ApiError("Правило не найдено", 404);
}

export async function listNotifications(userId: string, limit = 50) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
