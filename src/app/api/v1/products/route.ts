import { handler, ok } from "@/lib/api";
import { authByApiKey } from "@/lib/auth/api-key";
import { listProducts } from "@/server/services/products";

/** GET /api/v1/products — список товаров (авторизация по X-API-Key, тариф Pro). */
export const GET = handler(async (req) => {
  const user = await authByApiKey(req);
  const products = await listProducts(user.id);
  return ok(
    products.map((p) => ({
      id: p.id,
      marketplace: p.marketplace,
      externalId: p.externalId,
      title: p.title,
      url: p.url,
      price: p.lastPrice ? p.lastPrice.toNumber() : null,
      stock: p.lastStock,
      position: p.lastPosition,
      rating: p.rating,
      status: p.lastStatus,
      checkedAt: p.lastCheckedAt,
      competitors: p._count.competitors,
    })),
  );
});
