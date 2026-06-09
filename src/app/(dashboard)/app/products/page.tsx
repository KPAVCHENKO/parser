import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getPlan } from "@/lib/plans";
import { listProducts } from "@/server/services/products";
import { AddProductDialog } from "@/components/products/add-product-dialog";
import { ExportButtons } from "@/components/products/export-buttons";
import {
  ProductsTable,
  type ProductRow,
} from "@/components/products/products-table";

export const metadata: Metadata = { title: "Товары" };

export default async function ProductsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const plan = getPlan(user.subscription?.plan ?? "FREE");
  const products = await listProducts(user.id);
  const atLimit = products.length >= plan.maxProducts;

  const rows: ProductRow[] = products.map((p) => ({
    id: p.id,
    marketplace: p.marketplace,
    title: p.title,
    url: p.url,
    imageUrl: p.imageUrl,
    searchKeyword: p.searchKeyword,
    lastPrice: p.lastPrice ? p.lastPrice.toNumber() : null,
    lastStock: p.lastStock,
    lastPosition: p.lastPosition,
    rating: p.rating,
    lastStatus: p.lastStatus,
    lastError: p.lastError,
    lastCheckedAt: p.lastCheckedAt ? p.lastCheckedAt.toISOString() : null,
    competitorsCount: p._count.competitors,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Товары</h1>
          <p className="text-sm text-muted-foreground">
            {products.length} из {plan.maxProducts} на тарифе {plan.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {plan.features.export && <ExportButtons />}
          <AddProductDialog disabled={atLimit} />
        </div>
      </div>

      {atLimit && (
        <p className="rounded-md border border-warning/40 bg-warning/5 p-3 text-sm">
          Достигнут лимит тарифа {plan.name}. Удалите товар или перейдите на более
          высокий тариф, чтобы добавить новый.
        </p>
      )}

      <ProductsTable products={rows} />
    </div>
  );
}
