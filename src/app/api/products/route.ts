import { z } from "zod";
import { handler, parseBody, ok, created, authUser } from "@/lib/api";
import { addProduct, listProducts } from "@/server/services/products";
import type { Marketplace } from "@prisma/client";

export const GET = handler(async (req) => {
  const user = await authUser();
  const url = new URL(req.url);
  const mp = url.searchParams.get("marketplace") as Marketplace | null;
  const products = await listProducts(
    user.id,
    mp === "WB" || mp === "OZON" ? { marketplace: mp } : undefined,
  );
  return ok(products);
});

const createSchema = z.object({
  input: z.string().min(3, "Введите ссылку или артикул"),
  searchKeyword: z.string().max(200).optional(),
});

export const POST = handler(async (req) => {
  const user = await authUser();
  const data = await parseBody(req, createSchema);
  const product = await addProduct(user, data);
  return created(product);
});
