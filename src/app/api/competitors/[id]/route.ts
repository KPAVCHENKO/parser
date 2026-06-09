import { handler, ok, authUser } from "@/lib/api";
import { deleteCompetitor } from "@/server/services/competitors";

export const DELETE = handler(async (_req, { params }) => {
  const user = await authUser();
  await deleteCompetitor(user.id, params.id);
  return ok({ success: true });
});
