/**
 * Клиент ЮKassa. Создание платежей (в т.ч. рекуррентных с сохранённым
 * способом оплаты) и проверка статуса. Webhook не подписывается провайдером —
 * статус всегда перепроверяем запросом к API (не доверяем телу уведомления).
 */
import { randomUUID } from "node:crypto";
import { env } from "@/lib/env";

const API = "https://api.yookassa.ru/v3";

export interface YooAmount {
  value: string; // "990.00"
  currency: "RUB";
}
export interface YooPayment {
  id: string;
  status: "pending" | "waiting_for_capture" | "succeeded" | "canceled";
  paid: boolean;
  amount: YooAmount;
  payment_method?: { id?: string; saved?: boolean };
  confirmation?: { confirmation_url?: string };
  metadata?: Record<string, string>;
}

function authHeader(): string {
  const token = Buffer.from(
    `${env.yookassa.shopId}:${env.yookassa.secretKey}`,
  ).toString("base64");
  return `Basic ${token}`;
}

function ensureConfigured(): void {
  if (!env.yookassa.shopId || !env.yookassa.secretKey) {
    throw new Error("ЮKassa не настроена (YOOKASSA_SHOP_ID/SECRET_KEY)");
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { idempotenceKey?: string } = {},
): Promise<T> {
  ensureConfigured();
  const { idempotenceKey, headers, ...rest } = init;
  const res = await fetch(`${API}${path}`, {
    ...rest,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      "Idempotence-Key": idempotenceKey ?? randomUUID(),
      ...headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ЮKassa ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

function formatAmount(rub: number): string {
  return rub.toFixed(2);
}

/** Первичный платёж с редиректом и сохранением способа оплаты (для рекуррента). */
export async function createCheckoutPayment(params: {
  amountRub: number;
  description: string;
  returnUrl: string;
  metadata: Record<string, string>;
}): Promise<YooPayment> {
  return request<YooPayment>("/payments", {
    method: "POST",
    idempotenceKey: randomUUID(),
    body: JSON.stringify({
      amount: { value: formatAmount(params.amountRub), currency: "RUB" },
      capture: true,
      confirmation: { type: "redirect", return_url: params.returnUrl },
      description: params.description,
      save_payment_method: true,
      metadata: params.metadata,
    }),
  });
}

/** Автосписание по сохранённому способу оплаты (рекуррент). */
export async function createRecurringPayment(params: {
  amountRub: number;
  description: string;
  paymentMethodId: string;
  metadata: Record<string, string>;
}): Promise<YooPayment> {
  return request<YooPayment>("/payments", {
    method: "POST",
    idempotenceKey: randomUUID(),
    body: JSON.stringify({
      amount: { value: formatAmount(params.amountRub), currency: "RUB" },
      capture: true,
      payment_method_id: params.paymentMethodId,
      description: params.description,
      metadata: params.metadata,
    }),
  });
}

/** Перепроверка статуса платежа (используется в обработке webhook). */
export async function getPayment(id: string): Promise<YooPayment> {
  return request<YooPayment>(`/payments/${id}`, { method: "GET" });
}
