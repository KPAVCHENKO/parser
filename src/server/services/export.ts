/**
 * Подготовка данных для выгрузки (тариф Pro): текущий срез товаров и история цен.
 */
import { prisma } from "@/lib/db";

export interface ExportProductRow {
  marketplace: string;
  title: string;
  externalId: string;
  url: string;
  price: number | null;
  stock: number | null;
  position: number | null;
  rating: number | null;
  updatedAt: string | null;
}

export interface ExportPriceRow {
  marketplace: string;
  product: string;
  subject: string; // "Товар" | "Конкурент: …"
  price: number;
  oldPrice: number | null;
  recordedAt: string;
}

export interface ExportData {
  products: ExportProductRow[];
  priceHistory: ExportPriceRow[];
}

export async function getExportData(
  userId: string,
  sinceDays = 90,
): Promise<ExportData> {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);

  const [products, priceRows] = await Promise.all([
    prisma.product.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.priceHistory.findMany({
      where: { product: { userId }, recordedAt: { gte: since } },
      include: {
        product: { select: { title: true, marketplace: true } },
        competitor: { select: { title: true } },
      },
      orderBy: { recordedAt: "asc" },
    }),
  ]);

  return {
    products: products.map((p) => ({
      marketplace: p.marketplace,
      title: p.title,
      externalId: p.externalId,
      url: p.url,
      price: p.lastPrice ? p.lastPrice.toNumber() : null,
      stock: p.lastStock,
      position: p.lastPosition,
      rating: p.rating,
      updatedAt: p.lastCheckedAt ? p.lastCheckedAt.toISOString() : null,
    })),
    priceHistory: priceRows.map((r) => ({
      marketplace: r.product.marketplace,
      product: r.product.title,
      subject: r.competitor ? `Конкурент: ${r.competitor.title}` : "Товар",
      price: r.price.toNumber(),
      oldPrice: r.oldPrice ? r.oldPrice.toNumber() : null,
      recordedAt: r.recordedAt.toISOString(),
    })),
  };
}
