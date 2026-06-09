import { z } from "zod";
import { handler, parseBody, ok, authUser } from "@/lib/api";
import { startCheckout } from "@/server/services/billing";

const schema = z.object({
  plan: z.enum(["START", "PRO"]),
  interval: z.enum(["MONTH", "YEAR"]),
});

export const POST = handler(async (req) => {
  const user = await authUser();
  const { plan, interval } = await parseBody(req, schema);
  const result = await startCheckout(user.id, plan, interval);
  return ok(result);
});
