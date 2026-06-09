import { handler, ok, authUser } from "@/lib/api";
import { getSubscriptionInfo } from "@/server/services/billing";

export const GET = handler(async () => {
  const user = await authUser();
  return ok(await getSubscriptionInfo(user.id));
});
