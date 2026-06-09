import type { Marketplace } from "@prisma/client";
import type { MarketplaceAdapter, ParsedInput } from "./types";
import { wildberriesAdapter } from "./wildberries";
import { ozonAdapter } from "./ozon";

/**
 * Реестр адаптеров. Чтобы добавить маркетплейс (Яндекс Маркет, Мегамаркет) —
 * реализуйте MarketplaceAdapter и добавьте сюда одну строку.
 */
const ADAPTERS: Record<Marketplace, MarketplaceAdapter> = {
  WB: wildberriesAdapter,
  OZON: ozonAdapter,
};

export function getAdapter(marketplace: Marketplace): MarketplaceAdapter {
  return ADAPTERS[marketplace];
}

export function listAdapters(): MarketplaceAdapter[] {
  return Object.values(ADAPTERS);
}

/** Определяет маркетплейс и externalId по произвольному вводу (ссылка/артикул). */
export function detectFromInput(input: string): ParsedInput | null {
  for (const adapter of listAdapters()) {
    const parsed = adapter.matchInput(input);
    if (parsed) return parsed;
  }
  return null;
}
