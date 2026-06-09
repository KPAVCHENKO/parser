/**
 * Чтение истории для графиков. Точки агрегируются в бакеты (час/день),
 * серии товара и конкурентов сводятся в единый массив для Recharts.
 */
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api";

export type Metric = "price" | "stock" | "position";
export type Range = "7d" | "30d" | "90d";

export interface HistorySeries {
  key: string;
  name: string;
}
export interface HistoryResponse {
  metric: Metric;
  range: Range;
  series: HistorySeries[];
  data: Array<Record<string, number | string | null>>;
}

const RANGE_DAYS: Record<Range, number> = { "7d": 7, "30d": 30, "90d": 90 };

function sinceFor(range: Range): Date {
  return new Date(Date.now() - RANGE_DAYS[range] * 24 * 60 * 60 * 1000);
}

/** Усечение времени до бакета: час для 7д, день для 30/90д. */
function bucketKey(date: Date, range: Range): string {
  const d = new Date(date);
  if (range === "7d") {
    d.setMinutes(0, 0, 0);
  } else {
    d.setHours(0, 0, 0, 0);
  }
  return d.toISOString();
}

interface RawPoint {
  competitorId: string | null;
  value: number;
  recordedAt: Date;
}

function buildResponse(
  metric: Metric,
  range: Range,
  productTitle: string,
  competitors: Array<{ id: string; title: string }>,
  points: RawPoint[],
): HistoryResponse {
  // bucket -> seriesKey -> последнее значение в бакете
  const buckets = new Map<string, Record<string, number>>();
  for (const p of points) {
    const bk = bucketKey(p.recordedAt, range);
    const seriesKey = p.competitorId ?? "product";
    const row = buckets.get(bk) ?? {};
    row[seriesKey] = p.value; // points отсортированы по возрастанию => последнее побеждает
    buckets.set(bk, row);
  }

  const series: HistorySeries[] = [{ key: "product", name: productTitle }];
  if (metric !== "position") {
    for (const c of competitors) series.push({ key: c.id, name: c.title });
  }

  const data = [...buckets.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([t, values]) => {
      const row: Record<string, number | string | null> = { t };
      for (const s of series) row[s.key] = values[s.key] ?? null;
      return row;
    });

  return { metric, range, series, data };
}

export async function getProductHistory(
  userId: string,
  productId: string,
  metric: Metric,
  range: Range,
): Promise<HistoryResponse> {
  const product = await prisma.product.findFirst({
    where: { id: productId, userId },
    include: { competitors: { select: { id: true, title: true } } },
  });
  if (!product) throw new ApiError("Товар не найден", 404);

  const since = sinceFor(range);

  if (metric === "position") {
    const rows = await prisma.positionHistory.findMany({
      where: { productId, recordedAt: { gte: since } },
      orderBy: { recordedAt: "asc" },
      select: { position: true, recordedAt: true },
    });
    const points: RawPoint[] = rows
      .filter((r) => r.position !== null)
      .map((r) => ({
        competitorId: null,
        value: r.position as number,
        recordedAt: r.recordedAt,
      }));
    return buildResponse(metric, range, product.title, [], points);
  }

  if (metric === "stock") {
    const rows = await prisma.stockHistory.findMany({
      where: { productId, recordedAt: { gte: since } },
      orderBy: { recordedAt: "asc" },
      select: { competitorId: true, quantity: true, recordedAt: true },
    });
    const points: RawPoint[] = rows.map((r) => ({
      competitorId: r.competitorId,
      value: r.quantity,
      recordedAt: r.recordedAt,
    }));
    return buildResponse(metric, range, product.title, product.competitors, points);
  }

  // price
  const rows = await prisma.priceHistory.findMany({
    where: { productId, recordedAt: { gte: since } },
    orderBy: { recordedAt: "asc" },
    select: { competitorId: true, price: true, recordedAt: true },
  });
  const points: RawPoint[] = rows.map((r) => ({
    competitorId: r.competitorId,
    value: r.price.toNumber(),
    recordedAt: r.recordedAt,
  }));
  return buildResponse(metric, range, product.title, product.competitors, points);
}
