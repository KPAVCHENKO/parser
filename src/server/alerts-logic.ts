/**
 * Чистая бизнес-логика срабатывания алертов (без БД и сети) — покрыта тестами.
 */

/** Падение цены конкурента на >= thresholdPct процентов. */
export function evalCompetitorPriceDrop(
  oldPrice: number | null,
  newPrice: number | null,
  thresholdPct: number | null,
): { triggered: boolean; dropPct: number } {
  if (oldPrice === null || newPrice === null || oldPrice <= 0) {
    return { triggered: false, dropPct: 0 };
  }
  if (newPrice >= oldPrice) return { triggered: false, dropPct: 0 };
  const dropPct = Math.round((1 - newPrice / oldPrice) * 100);
  const threshold = thresholdPct ?? 1; // по умолчанию — любое падение от 1%
  return { triggered: dropPct >= threshold, dropPct };
}

/** Товар закончился: был в наличии, стал 0. */
export function evalOutOfStock(
  beforeStock: number | null,
  afterStock: number | null,
): { triggered: boolean } {
  const wasInStock = beforeStock !== null && beforeStock > 0;
  const nowOut = afterStock !== null && afterStock <= 0;
  return { triggered: wasInStock && nowOut };
}

/** Изменение позиции в выдаче более чем на N мест (в любую сторону). */
export function evalPositionChange(
  oldPos: number | null,
  newPos: number | null,
  thresholdPlaces: number | null,
): { triggered: boolean; delta: number; improved: boolean } {
  if (oldPos === null || newPos === null) {
    return { triggered: false, delta: 0, improved: false };
  }
  const delta = Math.abs(newPos - oldPos);
  const threshold = thresholdPlaces ?? 1;
  // Меньшая позиция = выше в выдаче = улучшение
  return { triggered: delta >= threshold, delta, improved: newPos < oldPos };
}
