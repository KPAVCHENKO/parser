import { z } from "zod";
import { handler, parseBody, ok, authUser } from "@/lib/api";
import { updateAlertRule, deleteAlertRule } from "@/server/services/alert-rules";

const patchSchema = z.object({
  thresholdValue: z.number().min(0).max(100000).nullable().optional(),
  channel: z.enum(["TELEGRAM", "EMAIL", "BOTH"]).optional(),
  isActive: z.boolean().optional(),
});

export const PATCH = handler(async (req, { params }) => {
  const user = await authUser();
  const input = await parseBody(req, patchSchema);
  const rule = await updateAlertRule(user.id, params.id, input);
  return ok(rule);
});

export const DELETE = handler(async (_req, { params }) => {
  const user = await authUser();
  await deleteAlertRule(user.id, params.id);
  return ok({ success: true });
});
