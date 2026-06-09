import { Prisma } from "@prisma/client";
import type { Marketplace, Plan } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { getAdapter, detectFromInput } from "@/adapters/registry";
import { AdapterError, type NormalizedCard } from "@/adapters/types";
import { assertCanAddProduct } from "@/server/guards";
import { getAdapterCredentials } from "./credentials";
import { recordProductSnapshot, markProductFailed } from "./history";

type SessionUser = {
  id: string;
  subscription?: { plan: Plan; status: string } | null;
};

/** Распознаёт ввод и тянет карточку (с кредами, если нужно). Не сохраняет. */
export async function previewProduct(
  userId: string,
  input: string,
): Promise<NormalizedCard> {
  const parsed = detectFromInput(input);
  if (!parsed) {
    throw new ApiError(
      "Не распознали ссылку или артикул. Поддерживаются Wildberries и Ozon.",
      422,
    );
  }
  const adapter = getAdapter(parsed.marketplace);
  const creds = await getAdapterCredentials(userId, parsed.marketplace);

  try {
    return await adapter.fetchCard(parsed.externalId, creds);
  } catch (err) {
    throw toApiError(err);
  }
}

/** Добавляет товар на мониторинг (с проверкой лимита тарифа). */
export async function addProduct(
  user: SessionUser,
  data: { input: string; searchKeyword?: string },
) {
  await assertCanAddProduct(user);

  const card = await previewProduct(user.id, data.input);

  let product;
  try {
    product = await prisma.product.create({
      data: {
        userId: user.id,
        marketplace: card.marketplace,
        externalId: card.externalId,
        title: card.title,
        brand: card.brand,
        imageUrl: card.imageUrl,
        url: card.url,
        searchKeyword: data.searchKeyword?.trim() || null,
        lastPrice: card.price ?? undefined,
        lastStock: card.stock ?? undefined,
        rating: card.rating ?? undefined,
        lastStatus: "OK",
        lastCheckedAt: new Date(),
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new ApiError("Этот товар уже добавлен", 409);
    }
    throw err;
  }

  // Стартовая точка истории
  await recordProductSnapshot(product, card);
  return product;
}

export async function listProducts(
  userId: string,
  filters?: { marketplace?: Marketplace },
) {
  return prisma.product.findMany({
    where: {
      userId,
      ...(filters?.marketplace ? { marketplace: filters.marketplace } : {}),
    },
    include: { _count: { select: { competitors: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProduct(userId: string, id: string) {
  const product = await prisma.product.findFirst({
    where: { id, userId },
    include: { competitors: true },
  });
  if (!product) throw new ApiError("Товар не найден", 404);
  return product;
}

export async function updateProduct(
  userId: string,
  id: string,
  data: { searchKeyword?: string | null; isActive?: boolean },
) {
  const existing = await prisma.product.findFirst({ where: { id, userId } });
  if (!existing) throw new ApiError("Товар не найден", 404);
  return prisma.product.update({
    where: { id },
    data: {
      searchKeyword:
        data.searchKeyword === undefined
          ? undefined
          : data.searchKeyword?.trim() || null,
      isActive: data.isActive,
    },
  });
}

export async function deleteProduct(userId: string, id: string) {
  const res = await prisma.product.deleteMany({ where: { id, userId } });
  if (res.count === 0) throw new ApiError("Товар не найден", 404);
}

/** Обновляет данные товара немедленно (ручной refresh). */
export async function refreshProductNow(userId: string, id: string) {
  const product = await prisma.product.findFirst({ where: { id, userId } });
  if (!product) throw new ApiError("Товар не найден", 404);

  const adapter = getAdapter(product.marketplace);
  const creds = await getAdapterCredentials(userId, product.marketplace);

  try {
    const card = await adapter.fetchCard(product.externalId, creds);
    await recordProductSnapshot(product, card);
    return prisma.product.findUnique({ where: { id } });
  } catch (err) {
    const apiErr = toApiError(err);
    await markProductFailed(product.id, apiErr.message);
    throw apiErr;
  }
}

function toApiError(err: unknown): ApiError {
  if (err instanceof AdapterError) {
    const status = err.opts.needsCredentials ? 403 : err.opts.status ?? 502;
    return new ApiError(err.message, status === 404 ? 404 : status === 403 ? 403 : 502);
  }
  if (err instanceof ApiError) return err;
  return new ApiError("Не удалось получить данные маркетплейса", 502);
}
