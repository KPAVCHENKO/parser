import { z } from "zod";
import { handler, parseBody, ok, created, authUser } from "@/lib/api";
import { prisma } from "@/lib/db";
import { addCompetitor } from "@/server/services/competitors";

export const GET = handler(async (_req, { params }) => {
  const user = await authUser();
  const competitors = await prisma.competitor.findMany({
    where: { productId: params.id, product: { userId: user.id } },
    orderBy: { createdAt: "asc" },
  });
  return ok(competitors);
});

const schema = z.object({ input: z.string().min(3, "Введите ссылку или артикул") });

export const POST = handler(async (req, { params }) => {
  const user = await authUser();
  const { input } = await parseBody(req, schema);
  const competitor = await addCompetitor(user, params.id, input);
  return created(competitor);
});
