import { handler, ok, authUser } from "@/lib/api";
import { cancelSubscription } from "@/server/services/billing";

export const POST = handler(async () => {
  const user = await authUser();
  await cancelSubscription(user.id);
  return ok({ success: true });
});
