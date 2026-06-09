import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getPlan } from "@/lib/plans";
import { getProduct } from "@/server/services/products";
import { ApiError } from "@/lib/api";
import {
  ProductDetail,
  type DetailProduct,
  type DetailCompetitor,
} from "@/components/products/product-detail";

export const metadata: Metadata = { title: "Карточка товара" };

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  let product;
  try {
    product = await getProduct(user.id, params.id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const plan = getPlan(user.subscription?.plan ?? "FREE");

  const detail: DetailProduct = {
    id: product.id,
    marketplace: product.marketplace,
    title: product.title,
    url: product.url,
    imageUrl: product.imageUrl,
    searchKeyword: product.searchKeyword,
    lastPrice: product.lastPrice ? product.lastPrice.toNumber() : null,
    lastStock: product.lastStock,
    lastPosition: product.lastPosition,
    rating: product.rating,
    lastStatus: product.lastStatus,
    lastError: product.lastError,
    lastCheckedAt: product.lastCheckedAt
      ? product.lastCheckedAt.toISOString()
      : null,
  };

  const competitors: DetailCompetitor[] = product.competitors.map((c) => ({
    id: c.id,
    marketplace: c.marketplace,
    title: c.title,
    url: c.url,
    imageUrl: c.imageUrl,
    lastPrice: c.lastPrice ? c.lastPrice.toNumber() : null,
    lastStock: c.lastStock,
  }));

  return (
    <ProductDetail
      product={detail}
      competitors={competitors}
      maxCompetitors={plan.maxCompetitorsPerProduct}
    />
  );
}
