import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/errors";
import { getPlan } from "@/lib/plans";

/**
 * Аутентификация публичного API по заголовку X-API-Key.
 * Доступ только на тарифах с фичей apiAccess (Pro).
 */
export async function authByApiKey(req: Request) {
  const key = req.headers.get("x-api-key");
  if (!key) throw new ApiError("Не передан X-API-Key", 401);

  const user = await prisma.user.findUnique({
    where: { apiKey: key },
    include: { subscription: true },
  });
  if (!user) throw new ApiError("Неверный API-ключ", 401);

  const plan = getPlan(user.subscription?.plan ?? "FREE");
  if (!plan.features.apiAccess) {
    throw new ApiError("API-доступ доступен на тарифе Pro", 403);
  }
  return user;
}
