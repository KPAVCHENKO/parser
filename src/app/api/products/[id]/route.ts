import { z } from "zod";
import { handler, parseBody, ok, authUser } from "@/lib/api";
import {
  getProduct,
  updateProduct,
  deleteProduct,
} from "@/server/services/products";

export const GET = handler(async (_req, { params }) => {
  const user = await authUser();
  const product = await getProduct(user.id, params.id);
  return ok(product);
});

const patchSchema = z.object({
  searchKeyword: z.string().max(200).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const PATCH = handler(async (req, { params }) => {
  const user = await authUser();
  const data = await parseBody(req, patchSchema);
  const product = await updateProduct(user.id, params.id, data);
  return ok(product);
});

export const DELETE = handler(async (_req, { params }) => {
  const user = await authUser();
  await deleteProduct(user.id, params.id);
  return ok({ success: true });
});
