/**
 * Управление токенами маркетплейсов. Секреты шифруются (AES-256-GCM) и НИКОГДА
 * не возвращаются клиенту в открытом виде.
 */
import type { Marketplace } from "@prisma/client";
import { prisma } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";
import type { AdapterCredentials } from "@/adapters/types";

/** Формат хранения: WB — token; Ozon — "clientId:apiKey". */
function packSecret(
  marketplace: Marketplace,
  input: { token?: string; clientId?: string; apiKey?: string },
): string {
  if (marketplace === "OZON") {
    return `${input.clientId ?? ""}:${input.apiKey ?? ""}`;
  }
  return input.token ?? "";
}

function unpackSecret(
  marketplace: Marketplace,
  secret: string,
): AdapterCredentials {
  if (marketplace === "OZON") {
    const [clientId, apiKey] = secret.split(":");
    return { clientId, apiKey };
  }
  return { token: secret };
}

export async function upsertCredential(
  userId: string,
  marketplace: Marketplace,
  input: { token?: string; clientId?: string; apiKey?: string; label?: string },
) {
  const encryptedSecret = encrypt(packSecret(marketplace, input));
  return prisma.marketplaceCredential.upsert({
    where: { userId_marketplace: { userId, marketplace } },
    create: {
      userId,
      marketplace,
      encryptedSecret,
      label: input.label,
      isValid: true,
    },
    update: { encryptedSecret, label: input.label, isValid: true },
  });
}

/** Список токенов БЕЗ секретов (для UI). */
export async function listCredentials(userId: string) {
  const creds = await prisma.marketplaceCredential.findMany({
    where: { userId },
    orderBy: { marketplace: "asc" },
  });
  return creds.map((c) => ({
    id: c.id,
    marketplace: c.marketplace,
    label: c.label,
    isValid: c.isValid,
    createdAt: c.createdAt,
  }));
}

export async function deleteCredential(userId: string, id: string) {
  await prisma.marketplaceCredential.deleteMany({ where: { id, userId } });
}

/** Расшифрованные креды для адаптера (только серверная сторона). */
export async function getAdapterCredentials(
  userId: string,
  marketplace: Marketplace,
): Promise<AdapterCredentials | undefined> {
  const cred = await prisma.marketplaceCredential.findUnique({
    where: { userId_marketplace: { userId, marketplace } },
  });
  if (!cred) return undefined;
  try {
    return unpackSecret(marketplace, decrypt(cred.encryptedSecret));
  } catch {
    return undefined;
  }
}
