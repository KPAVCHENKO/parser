import type { Plan } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { getAdapter, detectFromInput } from "@/adapters/registry";
import { AdapterError } from "@/adapters/types";
import { assertCanAddCompetitor } from "@/server/guards";
import { getAdapterCredentials } from "./credentials";
import { recordCompetitorSnapshot } from "./history";

type SessionUser = {
  id: string;
  subscription?: { plan: Plan; status: string } | null;
};

export async function addCompetitor(
  user: SessionUser,
  productId: string,
  input: string,
) {
  const product = await prisma.product.findFirst({
    where: { id: productId, userId: user.id },
  });
  if (!product) throw new ApiError("Товар не найден", 404);

  await assertCanAddCompetitor(user, productId);

  const parsed = detectFromInput(input);
  if (!parsed) {
    throw new ApiError("Не распознали ссылку или артикул конкурента", 422);
  }

  const adapter = getAdapter(parsed.marketplace);
  const creds = await getAdapterCredentials(user.id, parsed.marketplace);

  let card;
  try {
    card = await adapter.fetchCard(parsed.externalId, creds);
  } catch (err) {
    if (err instanceof AdapterError) {
      throw new ApiError(err.message, err.opts.needsCredentials ? 403 : 502);
    }
    throw new ApiError("Не удалось получить карточку конкурента", 502);
  }

  const competitor = await prisma.competitor.create({
    data: {
      productId,
      marketplace: card.marketplace,
      externalId: card.externalId,
      title: card.title,
      imageUrl: card.imageUrl,
      url: card.url,
      lastPrice: card.price ?? undefined,
      lastStock: card.stock ?? undefined,
    },
  });

  await recordCompetitorSnapshot(competitor, card);
  return competitor;
}

export async function deleteCompetitor(userId: string, id: string) {
  // Удаляем только если конкурент принадлежит товару пользователя
  const competitor = await prisma.competitor.findFirst({
    where: { id, product: { userId } },
  });
  if (!competitor) throw new ApiError("Конкурент не найден", 404);
  await prisma.competitor.delete({ where: { id } });
}
