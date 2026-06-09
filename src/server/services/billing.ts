/**
 * Биллинг: оформление подписки через ЮKassa, активация по факту оплаты,
 * рекуррентные продления и отмена. Учитывает реферальные бонусные дни.
 */
import { addMonths, addYears } from "date-fns";
import type { BillingInterval, Plan } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { env } from "@/lib/env";
import { planPrice, getPlan } from "@/lib/plans";
import {
  createCheckoutPayment,
  createRecurringPayment,
  getPayment,
} from "@/lib/billing/yookassa";

function periodEnd(from: Date, interval: BillingInterval): Date {
  return interval === "YEAR" ? addYears(from, 1) : addMonths(from, 1);
}

/** Создаёт платёж ЮKassa и возвращает URL для оплаты. */
export async function startCheckout(
  userId: string,
  plan: Plan,
  interval: BillingInterval,
): Promise<{ confirmationUrl: string }> {
  if (plan === "FREE") throw new ApiError("Free-тариф не требует оплаты", 400);

  const amount = planPrice(plan, interval);
  const payment = await createCheckoutPayment({
    amountRub: amount,
    description: `MarketPulse ${getPlan(plan).name} (${interval === "YEAR" ? "год" : "месяц"})`,
    returnUrl: `${env.appUrl}/app/billing?status=return`,
    metadata: { userId, plan, interval },
  });

  await prisma.payment.create({
    data: {
      userId,
      yookassaPaymentId: payment.id,
      amount,
      plan,
      interval,
      status: "PENDING",
      description: `Оплата тарифа ${plan}`,
    },
  });

  const url = payment.confirmation?.confirmation_url;
  if (!url) throw new ApiError("ЮKassa не вернула ссылку на оплату", 502);
  return { confirmationUrl: url };
}

/**
 * Обработка webhook: НЕ доверяем телу — перепроверяем платёж через API.
 * Идемпотентно: повторные уведомления не дублируют активацию.
 */
export async function handleWebhook(paymentId: string): Promise<void> {
  const payment = await getPayment(paymentId);
  const local = await prisma.payment.findUnique({
    where: { yookassaPaymentId: paymentId },
  });

  if (payment.status === "canceled") {
    if (local && local.status === "PENDING") {
      await prisma.payment.update({
        where: { yookassaPaymentId: paymentId },
        data: { status: "CANCELED" },
      });
    }
    return;
  }

  if (payment.status !== "succeeded" || !payment.paid) return;
  if (local && local.status === "SUCCEEDED") return; // уже обработан

  const meta = payment.metadata ?? {};
  const userId = meta.userId ?? local?.userId;
  const plan = (meta.plan as Plan) ?? local?.plan;
  const interval = (meta.interval as BillingInterval) ?? local?.interval ?? "MONTH";
  if (!userId || !plan) return;

  await activateSubscription({
    userId,
    plan,
    interval,
    paymentMethodId: payment.payment_method?.id,
    yookassaPaymentId: paymentId,
  });
}

interface ActivateInput {
  userId: string;
  plan: Plan;
  interval: BillingInterval;
  paymentMethodId?: string;
  yookassaPaymentId: string;
}

async function activateSubscription(input: ActivateInput): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) return;

  const now = new Date();
  let end = periodEnd(now, input.interval);

  // Реферальные бонусные дни — списываем единоразово, продлевая период
  if (user.referralCreditDays > 0) {
    end = new Date(end.getTime() + user.referralCreditDays * 24 * 60 * 60 * 1000);
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { yookassaPaymentId: input.yookassaPaymentId },
      data: { status: "SUCCEEDED" },
    }),
    prisma.subscription.update({
      where: { userId: input.userId },
      data: {
        plan: input.plan,
        interval: input.interval,
        status: "ACTIVE",
        autoRenew: true,
        currentPeriodEnd: end,
        yookassaPaymentMethodId:
          input.paymentMethodId ?? undefined,
      },
    }),
    prisma.user.update({
      where: { id: input.userId },
      data: { referralCreditDays: 0 },
    }),
  ]);
}

export async function cancelSubscription(userId: string): Promise<void> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub || sub.plan === "FREE") {
    throw new ApiError("Активной платной подписки нет", 400);
  }
  // Доступ сохраняется до конца оплаченного периода, автопродление выключается
  await prisma.subscription.update({
    where: { userId },
    data: { autoRenew: false },
  });
}

export async function getSubscriptionInfo(userId: string) {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  const cfg = getPlan(sub?.plan ?? "FREE");
  return {
    plan: sub?.plan ?? "FREE",
    planName: cfg.name,
    status: sub?.status ?? "ACTIVE",
    interval: sub?.interval ?? "MONTH",
    autoRenew: sub?.autoRenew ?? false,
    currentPeriodEnd: sub?.currentPeriodEnd ?? null,
  };
}

/**
 * Для воркера: автосписания по истёкшим периодам и даунгрейд неоплаченных.
 * Запускается раз в сутки.
 */
export async function processSubscriptionRenewals(): Promise<void> {
  const now = new Date();
  const due = await prisma.subscription.findMany({
    where: {
      status: { in: ["ACTIVE", "PAST_DUE"] },
      plan: { not: "FREE" },
      currentPeriodEnd: { lte: now },
    },
  });

  for (const sub of due) {
    // Отмена автопродления → даунгрейд на FREE
    if (!sub.autoRenew || !sub.yookassaPaymentMethodId) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { plan: "FREE", status: "CANCELED", autoRenew: false },
      });
      continue;
    }

    try {
      const amount = planPrice(sub.plan, sub.interval);
      const payment = await createRecurringPayment({
        amountRub: amount,
        description: `MarketPulse ${getPlan(sub.plan).name} — продление`,
        paymentMethodId: sub.yookassaPaymentMethodId,
        metadata: { userId: sub.userId, plan: sub.plan, interval: sub.interval },
      });

      if (payment.status === "succeeded" && payment.paid) {
        await prisma.$transaction([
          prisma.payment.create({
            data: {
              userId: sub.userId,
              yookassaPaymentId: payment.id,
              amount,
              plan: sub.plan,
              interval: sub.interval,
              status: "SUCCEEDED",
              isRecurring: true,
              description: "Автопродление подписки",
            },
          }),
          prisma.subscription.update({
            where: { id: sub.id },
            data: {
              status: "ACTIVE",
              currentPeriodEnd: periodEnd(now, sub.interval),
            },
          }),
        ]);
      } else {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: "PAST_DUE" },
        });
      }
    } catch (err) {
      console.error(`[billing] продление ${sub.id} не удалось:`, err);
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "PAST_DUE" },
      });
    }
  }
}
