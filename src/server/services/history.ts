/**
 * Запись истории (time-series) и обновление денормализованных «последних» полей.
 * Используется и ручным refresh, и фоновым воркером.
 */
import type { Competitor, Product } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { NormalizedCard, PositionResult } from "@/adapters/types";

/** Записывает снимок собственного товара и обновляет last*-поля. */
export async function recordProductSnapshot(
  product: Pick<Product, "id">,
  card: NormalizedCard,
): Promise<void> {
  const ops: Promise<unknown>[] = [];

  if (card.price !== null) {
    ops.push(
      prisma.priceHistory.create({
        data: {
          productId: product.id,
          price: card.price,
          oldPrice: card.oldPrice ?? null,
          discountPct: card.discountPct ?? null,
        },
      }),
    );
  }
  if (card.stock !== null) {
    ops.push(
      prisma.stockHistory.create({
        data: { productId: product.id, quantity: card.stock },
      }),
    );
  }

  ops.push(
    prisma.product.update({
      where: { id: product.id },
      data: {
        title: card.title,
        imageUrl: card.imageUrl,
        brand: card.brand,
        lastPrice: card.price ?? undefined,
        lastStock: card.stock ?? undefined,
        rating: card.rating ?? undefined,
        lastStatus: "OK",
        lastError: null,
        lastCheckedAt: new Date(),
      },
    }),
  );

  await Promise.all(ops);
}

/** Записывает снимок конкурента. */
export async function recordCompetitorSnapshot(
  competitor: Pick<Competitor, "id" | "productId">,
  card: NormalizedCard,
): Promise<void> {
  const ops: Promise<unknown>[] = [];

  if (card.price !== null) {
    ops.push(
      prisma.priceHistory.create({
        data: {
          productId: competitor.productId,
          competitorId: competitor.id,
          price: card.price,
          oldPrice: card.oldPrice ?? null,
          discountPct: card.discountPct ?? null,
        },
      }),
    );
  }
  if (card.stock !== null) {
    ops.push(
      prisma.stockHistory.create({
        data: {
          productId: competitor.productId,
          competitorId: competitor.id,
          quantity: card.stock,
        },
      }),
    );
  }

  ops.push(
    prisma.competitor.update({
      where: { id: competitor.id },
      data: {
        lastPrice: card.price ?? undefined,
        lastStock: card.stock ?? undefined,
      },
    }),
  );

  await Promise.all(ops);
}

/** Записывает позицию в поиске. */
export async function recordPositionSnapshot(
  productId: string,
  result: PositionResult,
): Promise<void> {
  await Promise.all([
    prisma.positionHistory.create({
      data: {
        productId,
        keyword: result.keyword,
        position: result.position,
        page: result.page,
      },
    }),
    prisma.product.update({
      where: { id: productId },
      data: { lastPosition: result.position ?? undefined },
    }),
  ]);
}

/** Помечает товар как «не удалось обновить». */
export async function markProductFailed(
  productId: string,
  error: string,
): Promise<void> {
  await prisma.product.update({
    where: { id: productId },
    data: { lastStatus: "FAILED", lastError: error.slice(0, 480), lastCheckedAt: new Date() },
  });
}
