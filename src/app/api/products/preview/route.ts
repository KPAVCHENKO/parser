import { z } from "zod";
import { handler, parseBody, ok, authUser } from "@/lib/api";
import { previewProduct } from "@/server/services/products";

const schema = z.object({ input: z.string().min(3, "Введите ссылку или артикул") });

export const POST = handler(async (req) => {
  const user = await authUser();
  const { input } = await parseBody(req, schema);
  const card = await previewProduct(user.id, input);
  return ok(card);
});
