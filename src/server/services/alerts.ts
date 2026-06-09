/**
 * Диспетчер алертов: загружает правила, применяет чистую логику и создаёт
 * уведомления (Notification + задача в очередь notify).
 */
import type { AlertRule, Competitor, Product } from "@prisma/client";
import { prisma } from "@/lib/db";
import { enqueueNotification } from "@/lib/queue/queues";
import type { NormalizedCard } from "@/adapters/types";
import {
  evalCompetitorPriceDrop,
  evalOutOfStock,
  evalPositionChange,
} from "@/server/alerts-logic";

interface RefreshAlertInput {
  product: Product;
  before: { price: number | null; stock: number | null };
  card: NormalizedCard;
  competitorCards: Array<{ competitor: Competitor; card: NormalizedCard }>;
}

async function rulesFor(product: Product, type: AlertRule["type"]) {
  return prisma.alertRule.findMany({
    where: {
      userId: product.userId,
      isActive: true,
      type,
      OR: [{ productId: product.id }, { productId: null }],
    },
  });
}

async function dispatch(
  product: Product,
  rule: AlertRule,
  title: string,
  message: string,
): Promise<void> {
  const notification = await prisma.notification.create({
    data: {
      userId: product.userId,
      productId: product.id,
      type: rule.type,
      channel: rule.channel,
      title,
      message,
      status: "PENDING",
    },
  });
  await enqueueNotification(notification.id);
}

/** Оценивает алерты после обновления карточки (цена конкурента / остаток). */
export async function evaluateProductAlerts(
  input: RefreshAlertInput,
): Promise<void> {
  const { product, before, card, competitorCards } = input;

  // Товар закончился
  const stockRules = await rulesFor(product, "OUT_OF_STOCK");
  if (stockRules.length) {
    const { triggered } = evalOutOfStock(before.stock, card.stock);
    if (triggered) {
      for (const rule of stockRules) {
        await dispatch(
          product,
          rule,
          "Товар закончился",
          `«${product.title}» закончился на ${product.marketplace}.`,
        );
      }
    }
  }

  // Конкурент снизил цену
  const priceRules = await rulesFor(product, "COMPETITOR_PRICE_DROP");
  if (priceRules.length) {
    for (const rule of priceRules) {
      for (const { competitor, card: cCard } of competitorCards) {
        const oldPrice = competitor.lastPrice
          ? competitor.lastPrice.toNumber()
          : null;
        const { triggered, dropPct } = evalCompetitorPriceDrop(
          oldPrice,
          cCard.price,
          rule.thresholdValue,
        );
        if (triggered) {
          await dispatch(
            product,
            rule,
            "Конкурент снизил цену",
            `«${competitor.title}» подешевел на ${dropPct}% → ${cCard.price} ₽ (товар «${product.title}»).`,
          );
        }
      }
    }
  }
}

/** Оценивает алерт изменения позиции (вызывается из джоба позиции). */
export async function evaluatePositionAlert(
  product: Product,
  oldPos: number | null,
  newPos: number | null,
): Promise<void> {
  const rules = await rulesFor(product, "POSITION_CHANGE");
  if (!rules.length) return;
  for (const rule of rules) {
    const { triggered, delta, improved } = evalPositionChange(
      oldPos,
      newPos,
      rule.thresholdValue,
    );
    if (triggered) {
      await dispatch(
        product,
        rule,
        "Изменение позиции в выдаче",
        `«${product.title}»: позиция ${improved ? "выросла" : "упала"} на ${delta} (${oldPos} → ${newPos}) по запросу «${product.searchKeyword}».`,
      );
    }
  }
}
