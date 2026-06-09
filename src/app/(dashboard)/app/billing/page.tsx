import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getSubscriptionInfo } from "@/server/services/billing";
import { PLANS, PLAN_ORDER } from "@/lib/plans";
import { BillingClient } from "@/components/billing/billing-client";

export const metadata: Metadata = { title: "Подписка" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const info = await getSubscriptionInfo(user.id);
  const plans = PLAN_ORDER.map((id) => PLANS[id]);

  const sub = {
    plan: info.plan,
    planName: info.planName,
    status: info.status,
    interval: info.interval,
    autoRenew: info.autoRenew,
    currentPeriodEnd: info.currentPeriodEnd
      ? info.currentPeriodEnd.toISOString()
      : null,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Подписка</h1>
        <p className="text-sm text-muted-foreground">
          Управление тарифом и оплатой.
        </p>
      </div>

      {searchParams.status === "return" && (
        <p className="rounded-md border border-primary/40 bg-primary/5 p-3 text-sm">
          Платёж обрабатывается. После подтверждения ЮKassa тариф обновится
          автоматически в течение минуты.
        </p>
      )}

      <BillingClient plans={plans} sub={sub} />
    </div>
  );
}
