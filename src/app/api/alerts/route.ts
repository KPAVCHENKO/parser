import { z } from "zod";
import { handler, parseBody, ok, created, authUser } from "@/lib/api";
import { listAlertRules, createAlertRule } from "@/server/services/alert-rules";

export const GET = handler(async () => {
  const user = await authUser();
  return ok(await listAlertRules(user.id));
});

const schema = z.object({
  type: z.enum(["COMPETITOR_PRICE_DROP", "OUT_OF_STOCK", "POSITION_CHANGE"]),
  thresholdValue: z.number().min(0).max(100000).nullable().optional(),
  channel: z.enum(["TELEGRAM", "EMAIL", "BOTH"]),
  productId: z.string().nullable().optional(),
});

export const POST = handler(async (req) => {
  const user = await authUser();
  const input = await parseBody(req, schema);
  const rule = await createAlertRule(user.id, input);
  return created(rule);
});
