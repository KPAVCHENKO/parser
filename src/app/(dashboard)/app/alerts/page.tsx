import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getPlan } from "@/lib/plans";
import { prisma } from "@/lib/db";
import {
  listAlertRules,
  listNotifications,
} from "@/server/services/alert-rules";
import { AlertsClient } from "@/components/alerts/alerts-client";

export const metadata: Metadata = { title: "Уведомления" };

export default async function AlertsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const plan = getPlan(user.subscription?.plan ?? "FREE");
  const [rules, products, notifications] = await Promise.all([
    listAlertRules(user.id),
    prisma.product.findMany({
      where: { userId: user.id },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
    }),
    listNotifications(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Уведомления</h1>
        <p className="text-sm text-muted-foreground">
          Правила алертов и история отправленных уведомлений.
        </p>
      </div>

      <AlertsClient
        telegramConnected={!!user.telegramChatId}
        telegramAllowed={plan.features.telegram}
        products={products}
        rules={rules.map((r) => ({
          id: r.id,
          type: r.type,
          thresholdValue: r.thresholdValue,
          channel: r.channel,
          isActive: r.isActive,
          product: r.product ? { id: r.product.id, title: r.product.title } : null,
        }))}
        notifications={notifications.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          status: n.status,
          createdAt: n.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
