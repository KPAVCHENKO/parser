import { handler, ok } from "@/lib/api";
import { PLANS, PLAN_ORDER } from "@/lib/plans";

export const GET = handler(async () => {
  return ok(PLAN_ORDER.map((id) => PLANS[id]));
});
