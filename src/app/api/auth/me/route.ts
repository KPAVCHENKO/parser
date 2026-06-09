import { handler, ok, authUser } from "@/lib/api";
import { getPlan } from "@/lib/plans";

export const POST = handler(async () => {
  const user = await authUser();
  const plan = getPlan(user.subscription?.plan ?? "FREE");
  return ok({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerified: !!user.emailVerified,
    referralCode: user.referralCode,
    plan: {
      id: plan.id,
      name: plan.name,
      maxProducts: plan.maxProducts,
      features: plan.features,
    },
    subscription: user.subscription
      ? {
          plan: user.subscription.plan,
          status: user.subscription.status,
          interval: user.subscription.interval,
          currentPeriodEnd: user.subscription.currentPeriodEnd,
        }
      : null,
  });
});

export const GET = POST;
