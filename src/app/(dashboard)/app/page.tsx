import { Package, Bell, TrendingUp } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getPlan } from "@/lib/plans";
import { prisma } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardHome() {
  const user = await getCurrentUser();
  if (!user) return null;

  const plan = getPlan(user.subscription?.plan ?? "FREE");
  const [productCount, activeAlerts] = await Promise.all([
    prisma.product.count({ where: { userId: user.id } }),
    prisma.alertRule.count({ where: { userId: user.id, isActive: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Привет{user.name ? `, ${user.name}` : ""}!
        </h1>
        <p className="text-muted-foreground">
          Обзор вашего мониторинга на маркетплейсах.
        </p>
      </div>

      {!user.emailVerified && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="py-4 text-sm">
            Подтвердите email — мы отправили письмо со ссылкой. Без подтверждения
            часть уведомлений может не приходить.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={<Package className="h-5 w-5 text-primary" />}
          title="Товары на мониторинге"
          value={`${productCount} / ${plan.maxProducts}`}
        />
        <StatCard
          icon={<Bell className="h-5 w-5 text-primary" />}
          title="Активные уведомления"
          value={String(activeAlerts)}
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-primary" />}
          title="Частота обновления"
          value={formatInterval(plan.refreshIntervalMinutes)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Ваш тариф
            <Badge>{plan.name}</Badge>
          </CardTitle>
          <CardDescription>
            До {plan.maxProducts} товаров · обновление{" "}
            {formatInterval(plan.refreshIntervalMinutes)} ·{" "}
            {plan.features.telegram ? "Telegram ✓" : "Telegram —"} ·{" "}
            {plan.features.export ? "Экспорт ✓" : "Экспорт —"}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          Реферальный код:{" "}
          <span className="rounded bg-muted px-2 py-1 font-mono">
            {user.referralCode}
          </span>{" "}
          — приглашайте друзей и получайте бонусные дни подписки.
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function formatInterval(minutes: number): string {
  if (minutes >= 1440) return "1 раз в сутки";
  if (minutes >= 60) return `каждые ${minutes / 60} ч`;
  return `каждые ${minutes} мин`;
}
