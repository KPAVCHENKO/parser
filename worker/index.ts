/**
 * Точка входа фонового воркера MarketPulse.
 * Запуск: pnpm worker (tsx worker/index.ts)
 *
 * - Раздельные очереди обновления карточек по маркетплейсам с индивидуальными
 *   rate limits.
 * - Планировщик ставит «созревшие» товары по расписанию их тарифа.
 */
import "dotenv/config";
import { Worker, type Processor } from "bullmq";
import { redis } from "@/lib/queue/connection";
import { QUEUE } from "@/lib/queue/queues";
import { env } from "@/lib/env";
import { processRefresh } from "./jobs/refresh";
import { processPosition } from "./jobs/position";
import { processNotification } from "./jobs/notify";
import { enqueueDueProducts } from "./scheduler";
import { processSubscriptionRenewals } from "@/server/services/billing";

const SCHEDULER_TICK_MS = 60_000; // проверяем «созревшие» товары раз в минуту
const BILLING_TICK_MS = 6 * 60 * 60 * 1000; // автопродления — раз в 6 часов

const refreshProcessor: Processor = async (job) => {
  await processRefresh(job.data.productId);
};

const positionProcessor: Processor = async (job) => {
  await processPosition(job.data.productId);
};

const notifyProcessor: Processor = async (job) => {
  await processNotification(job.data.notificationId);
};

const workers: Worker[] = [
  new Worker(QUEUE.refreshWB, refreshProcessor, {
    connection: redis,
    concurrency: 5,
    limiter: { max: env.limits.wbRps, duration: 1000 },
  }),
  new Worker(QUEUE.refreshOZON, refreshProcessor, {
    connection: redis,
    concurrency: 3,
    limiter: { max: env.limits.ozonRps, duration: 1000 },
  }),
  new Worker(QUEUE.position, positionProcessor, {
    connection: redis,
    concurrency: 2,
    limiter: { max: env.limits.wbRps, duration: 1000 },
  }),
  new Worker(QUEUE.notify, notifyProcessor, {
    connection: redis,
    concurrency: 5,
  }),
];

for (const w of workers) {
  w.on("failed", (job, err) => {
    console.error(`[worker:${w.name}] job ${job?.id} failed:`, err.message);
  });
}

console.log("[worker] запущен. Очереди:", workers.map((w) => w.name).join(", "));

// Планировщик
async function tick() {
  try {
    const n = await enqueueDueProducts();
    if (n > 0) console.log(`[scheduler] поставлено в очередь: ${n}`);
  } catch (err) {
    console.error("[scheduler] ошибка:", err);
  }
}
void tick();
const schedulerTimer = setInterval(() => void tick(), SCHEDULER_TICK_MS);

// Биллинг: автопродления и даунгрейд истёкших подписок
async function billingTick() {
  try {
    await processSubscriptionRenewals();
  } catch (err) {
    console.error("[billing] ошибка продлений:", err);
  }
}
void billingTick();
const billingTimer = setInterval(() => void billingTick(), BILLING_TICK_MS);

// Грейсфул-шатдаун
async function shutdown() {
  console.log("[worker] остановка…");
  clearInterval(schedulerTimer);
  clearInterval(billingTimer);
  await Promise.all(workers.map((w) => w.close()));
  await redis.quit();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
