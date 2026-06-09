import { handler, ok, authUser } from "@/lib/api";
import { refreshProductNow } from "@/server/services/products";

export const POST = handler(async (_req, { params }) => {
  const user = await authUser();
  const product = await refreshProductNow(user.id, params.id);
  return ok(product);
});
