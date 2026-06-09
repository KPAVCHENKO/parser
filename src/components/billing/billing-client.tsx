"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, formatPrice } from "@/lib/utils";

interface PlanCfg {
  id: "FREE" | "START" | "PRO";
  name: string;
  maxProducts: number;
  refreshIntervalMinutes: number;
  features: { telegram: boolean; apiAccess: boolean; export: boolean };
  price: { month: number; year: number };
}

interface SubInfo {
  plan: "FREE" | "START" | "PRO";
  planName: string;
  status: string;
  interval: "MONTH" | "YEAR";
  autoRenew: boolean;
  currentPeriodEnd: string | null;
}

function interval(minutes: number): string {
  if (minutes >= 1440) return "1 раз в сутки";
  if (minutes >= 60) return `каждые ${minutes / 60} ч`;
  return `каждые ${minutes} мин`;
}

export function BillingClient({
  plans,
  sub,
}: {
  plans: PlanCfg[];
  sub: SubInfo;
}) {
  const router = useRouter();
  const [billing, setBilling] = React.useState<"MONTH" | "YEAR">(sub.interval);
  const [busy, setBusy] = React.useState<string | null>(null);

  async function checkout(plan: "START" | "PRO") {
    setBusy(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval: billing }),
      });
      const json = await res.json();
      if (res.ok && json.data?.confirmationUrl) {
        window.location.href = json.data.confirmationUrl;
      } else {
        alert(json.error || "Не удалось создать платёж");
        setBusy(null);
      }
    } catch {
      alert("Сетевая ошибка");
      setBusy(null);
    }
  }

  async function cancel() {
    if (!confirm("Отключить автопродление? Доступ сохранится до конца периода.")) {
      return;
    }
    setBusy("cancel");
    try {
      await fetch("/api/billing/cancel", { method: "POST" });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Текущая подписка */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Текущий тариф <Badge>{sub.planName}</Badge>
            {sub.status === "PAST_DUE" && (
              <Badge variant="destructive">просрочен платёж</Badge>
            )}
          </CardTitle>
          <CardDescription>
            {sub.plan === "FREE"
              ? "Вы на бесплатном тарифе."
              : sub.autoRenew
                ? `Автопродление включено${sub.currentPeriodEnd ? `, следующее списание ${new Date(sub.currentPeriodEnd).toLocaleDateString("ru-RU")}` : ""}.`
                : `Автопродление отключено. Доступ до ${sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString("ru-RU") : "конца периода"}.`}
          </CardDescription>
        </CardHeader>
        {sub.plan !== "FREE" && sub.autoRenew && (
          <CardContent>
            <Button variant="outline" onClick={cancel} disabled={busy === "cancel"}>
              {busy === "cancel" && <Loader2 className="h-4 w-4 animate-spin" />}
              Отключить автопродление
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Переключатель период */}
      <div className="flex items-center justify-center gap-2">
        <div className="flex gap-1 rounded-md border p-0.5">
          <button
            onClick={() => setBilling("MONTH")}
            className={cn(
              "rounded px-4 py-1.5 text-sm font-medium transition-colors",
              billing === "MONTH"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Помесячно
          </button>
          <button
            onClick={() => setBilling("YEAR")}
            className={cn(
              "rounded px-4 py-1.5 text-sm font-medium transition-colors",
              billing === "YEAR"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Год <span className="text-success">−20%</span>
          </button>
        </div>
      </div>

      {/* Тарифы */}
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => {
          const isCurrent = p.id === sub.plan;
          const price = billing === "YEAR" ? p.price.year : p.price.month;
          return (
            <Card
              key={p.id}
              className={cn(p.id === "PRO" && "border-primary shadow-md")}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {p.name}
                  {p.id === "PRO" && <Badge>Популярный</Badge>}
                </CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold text-foreground">
                    {p.id === "FREE" ? "0 ₽" : formatPrice(price)}
                  </span>
                  {p.id !== "FREE" && (
                    <span className="text-muted-foreground">
                      {" "}
                      / {billing === "YEAR" ? "год" : "мес"}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm">
                  <Feat>До {p.maxProducts} товаров</Feat>
                  <Feat>Обновление {interval(p.refreshIntervalMinutes)}</Feat>
                  <Feat on={p.features.telegram}>Telegram-уведомления</Feat>
                  <Feat on={p.features.apiAccess}>API-доступ</Feat>
                  <Feat on={p.features.export}>Выгрузка в Excel/CSV</Feat>
                </ul>
                {p.id === "FREE" ? (
                  <Button variant="outline" className="w-full" disabled>
                    {isCurrent ? "Текущий тариф" : "Бесплатно"}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    disabled={isCurrent || busy === p.id}
                    onClick={() => checkout(p.id as "START" | "PRO")}
                  >
                    {busy === p.id && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isCurrent ? "Текущий тариф" : "Оформить"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Оплата через ЮKassa. Нажимая «Оформить», вы соглашаетесь с{" "}
        <a href="/offer" className="underline">офертой</a>. Подписка продлевается
        автоматически, отключить можно в любой момент.
      </p>
    </div>
  );
}

function Feat({ children, on = true }: { children: React.ReactNode; on?: boolean }) {
  return (
    <li
      className={cn(
        "flex items-center gap-2",
        !on && "text-muted-foreground line-through",
      )}
    >
      <Check className={cn("h-4 w-4", on ? "text-success" : "text-muted-foreground")} />
      {children}
    </li>
  );
}
