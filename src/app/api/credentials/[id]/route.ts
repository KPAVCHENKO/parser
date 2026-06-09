import { handler, ok, authUser } from "@/lib/api";
import { deleteCredential } from "@/server/services/credentials";

export const DELETE = handler(async (_req, { params }) => {
  const user = await authUser();
  await deleteCredential(user.id, params.id);
  return ok({ success: true });
});
