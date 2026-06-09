/**
 * Обработчик обновления карточки товара и его конкурентов.
 * Импортирует только worker-safe модули (без next/headers).
 */
import { prisma } from "@/lib/db";
import { getAdapter } from "@/adapters/registry";
import { AdapterError } from "@/adapters/types";
import { getAdapterCredentials } from "@/server/services/credentials";
import {
  recordProductSnapshot,
  recordCompetitorSnapshot,
  markProductFailed,
} from "@/server/services/history";
import { evaluateProductAlerts } from "@/server/services/alerts";

export async function processRefresh(productId: string): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { competitors: true },
  });
  if (!product || !product.isActive) return;

  const adapter = getAdapter(product.marketplace);
  const creds = await getAdapterCredentials(product.userId, product.marketplace);

  // Снимок «до» для движка алертов
  const before = {
    price: product.lastPrice ? product.lastPrice.toNumber() : null,
    stock: product.lastStock,
  };

  let card;
  try {
    card = await adapter.fetchCard(product.externalId, creds);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Ошибка обновления";
    await markProductFailed(product.id, msg);
    // Не-ретраябельные ошибки (404 / нет токена) не повторяем
    if (err instanceof AdapterError && err.opts.retryable === false) return;
    throw err;
  }

  await recordProductSnapshot(product, card);

  // Конкуренты — каждый независимо, ошибки не валят весь джоб
  const competitorCards = [];
  for (const c of product.competitors) {
    try {
      const cAdapter = getAdapter(c.marketplace);
      const cCreds = await getAdapterCredentials(product.userId, c.marketplace);
      const cCard = await cAdapter.fetchCard(c.externalId, cCreds);
      await recordCompetitorSnapshot(c, cCard);
      competitorCards.push({ competitor: c, card: cCard });
    } catch (err) {
      console.warn(
        `[worker] конкурент ${c.id} не обновлён:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  // Движок алертов (Telegram/email) — этап 6
  await evaluateProductAlerts({
    product,
    before,
    card,
    competitorCards,
  });
}
