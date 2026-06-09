import { handler, ok, authUser } from "@/lib/api";
import { listNotifications } from "@/server/services/alert-rules";

export const GET = handler(async () => {
  const user = await authUser();
  return ok(await listNotifications(user.id));
});
