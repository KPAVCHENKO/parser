/**
 * Обработчик проверки позиции товара в поисковой выдаче по ключевому запросу.
 */
import { prisma } from "@/lib/db";
import { getAdapter } from "@/adapters/registry";
import { recordPositionSnapshot } from "@/server/services/history";
import { evaluatePositionAlert } from "@/server/services/alerts";

export async function processPosition(productId: string): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!product || !product.isActive || !product.searchKeyword) return;

  const adapter = getAdapter(product.marketplace);
  if (!adapter.fetchPosition) return; // площадка не поддерживает (напр. Ozon)

  const oldPos = product.lastPosition;
  const result = await adapter.fetchPosition(
    product.externalId,
    product.searchKeyword,
  );

  await recordPositionSnapshot(product.id, result);
  await evaluatePositionAlert(product, oldPos, result.position);
}
