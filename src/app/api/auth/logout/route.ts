import { handler, ok } from "@/lib/api";
import { destroySession } from "@/lib/auth/session";

export const POST = handler(async () => {
  destroySession();
  return ok({ success: true });
});
