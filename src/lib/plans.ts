/**
 * Тарифные планы — ЕДИНЫЙ источник правды.
 * Лимиты фич, частота обновления, цены (мес/год со скидкой 20%).
 */
import type { Plan, BillingInterval } from "@prisma/client";

export interface PlanConfig {
  id: Plan;
  name: string;
  /** Максимум товаров на мониторинге */
  maxProducts: number;
  /** Период обновления данных, минут */
  refreshIntervalMinutes: number;
  /** Максимум конкурентов на товар */
  maxCompetitorsPerProduct: number;
  features: {
    telegram: boolean;
    apiAccess: boolean;
    export: boolean;
  };
  price: {
    /** Цена за месяц, ₽ */
    month: number;
    /** Цена за год, ₽ (со скидкой 20%) */
    year: number;
  };
}

/** Скидка на годовую оплату */
export const ANNUAL_DISCOUNT = 0.2;

/** Бонус за приведённого реферала (дней подписки обоим) */
export const REFERRAL_BONUS_DAYS = 30;

function annual(monthly: number): number {
  // 12 месяцев со скидкой 20%, округляем до целых рублей
  return Math.round(monthly * 12 * (1 - ANNUAL_DISCOUNT));
}

export const PLANS: Record<Plan, PlanConfig> = {
  FREE: {
    id: "FREE",
    name: "Free",
    maxProducts: 5,
    refreshIntervalMinutes: 24 * 60, // 1 раз в сутки
    maxCompetitorsPerProduct: 1,
    features: { telegram: false, apiAccess: false, export: false },
    price: { month: 0, year: 0 },
  },
  START: {
    id: "START",
    name: "Start",
    maxProducts: 100,
    refreshIntervalMinutes: 4 * 60, // каждые 4 часа
    maxCompetitorsPerProduct: 5,
    features: { telegram: true, apiAccess: false, export: false },
    price: { month: 990, year: annual(990) },
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    maxProducts: 1000,
    refreshIntervalMinutes: 60, // каждый час
    maxCompetitorsPerProduct: 5,
    features: { telegram: true, apiAccess: true, export: true },
    price: { month: 2990, year: annual(2990) },
  },
};

export const PLAN_ORDER: Plan[] = ["FREE", "START", "PRO"];

export function getPlan(plan: Plan): PlanConfig {
  return PLANS[plan];
}

export function planPrice(plan: Plan, interval: BillingInterval): number {
  const cfg = PLANS[plan];
  return interval === "YEAR" ? cfg.price.year : cfg.price.month;
}

/** Можно ли с тарифа `from` перейти на `to` как апгрейд */
export function isUpgrade(from: Plan, to: Plan): boolean {
  return PLAN_ORDER.indexOf(to) > PLAN_ORDER.indexOf(from);
}
