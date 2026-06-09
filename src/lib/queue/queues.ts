/**
 * Очереди BullMQ. Раздельные очереди обновления карточек по маркетплейсам —
 * чтобы соблюдать индивидуальные rate limits каждой площадки.
 */
import { Queue, type JobsOptions } from "bullmq";
import type { Marketplace } from "@prisma/client";
import { redis } from "./connection";

export const QUEUE = {
  refreshWB: "mp-refresh-wb",
  refreshOZON: "mp-refresh-ozon",
  position: "mp-position",
  notify: "mp-notify",
} as const;

export type RefreshJob = { productId: string };
export type PositionJob = { productId: string };
export type NotifyJob = {
  notificationId: string;
};

const DEFAULT_OPTS: JobsOptions = {
  attempts: 4,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: { age: 3600, count: 1000 },
  removeOnFail: { age: 24 * 3600, count: 1000 },
};

const queues = new Map<string, Queue>();

function getQueue(name: string): Queue {
  let q = queues.get(name);
  if (!q) {
    q = new Queue(name, { connection: redis, defaultJobOptions: DEFAULT_OPTS });
    queues.set(name, q);
  }
  return q;
}

export function refreshQueueName(marketplace: Marketplace): string {
  return marketplace === "OZON" ? QUEUE.refreshOZON : QUEUE.refreshWB;
}

/** Ставит задачу обновления карточки товара. jobId дедуплицирует. */
export async function enqueueRefresh(
  productId: string,
  marketplace: Marketplace,
): Promise<void> {
  const q = getQueue(refreshQueueName(marketplace));
  await q.add("refresh", { productId } satisfies RefreshJob, {
    jobId: `refresh-${productId}`,
  });
}

export async function enqueuePosition(productId: string): Promise<void> {
  const q = getQueue(QUEUE.position);
  await q.add("position", { productId } satisfies PositionJob, {
    jobId: `position-${productId}`,
  });
}

export async function enqueueNotification(
  notificationId: string,
): Promise<void> {
  const q = getQueue(QUEUE.notify);
  await q.add("notify", { notificationId } satisfies NotifyJob);
}
