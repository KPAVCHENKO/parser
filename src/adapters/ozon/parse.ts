/**
 * Чистые функции парсинга Ozon (без сети) — для тестов.
 */
import type { NormalizedCard, ParsedInput } from "../types";

/** Распознаёт SKU из ссылки Ozon или из «голого» числа. */
export function parseOzonInput(input: string): ParsedInput | null {
  const trimmed = input.trim();

  if (/^\d{5,15}$/.test(trimmed)) {
    return { marketplace: "OZON", externalId: trimmed };
  }

  if (/ozon\.ru/i.test(trimmed)) {
    // .../product/nazvanie-tovara-1234567890/...
    const m = trimmed.match(/-(\d{5,15})\/?(?:\?|$|#)/);
    if (m) return { marketplace: "OZON", externalId: m[1] };
    const alt = trimmed.match(/product\/(?:[^/]*-)?(\d{5,15})/);
    if (alt) return { marketplace: "OZON", externalId: alt[1] };
  }
  return null;
}

export function ozonProductUrl(sku: string): string {
  return `https://www.ozon.ru/product/${sku}/`;
}

interface OzonStocks {
  present?: number;
  reserved?: number;
  coming?: number;
}
export interface OzonProductInfo {
  result?: {
    id?: number;
    name?: string;
    offer_id?: string;
    price?: string;
    old_price?: string;
    marketing_price?: string;
    primary_image?: string;
    images?: string[];
    stocks?: OzonStocks;
  };
}

const toNum = (v?: string | null): number | null => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};

/** Нормализует ответ Ozon /v2/product/info в NormalizedCard. */
export function parseOzonProductInfo(
  json: OzonProductInfo,
  sku: string,
): NormalizedCard {
  const r = json.result;
  if (!r || (!r.name && !r.price)) {
    throw new Error("Товар не найден в ответе Ozon");
  }

  const price = toNum(r.marketing_price) ?? toNum(r.price);
  const oldPrice = toNum(r.old_price);
  const discountPct =
    price !== null && oldPrice !== null && oldPrice > price
      ? Math.round((1 - price / oldPrice) * 100)
      : null;

  const present = r.stocks?.present ?? null;
  const reserved = r.stocks?.reserved ?? 0;
  const stock = present === null ? null : Math.max(0, present - reserved);

  return {
    marketplace: "OZON",
    externalId: sku,
    title: r.name ?? `Товар ${sku}`,
    imageUrl: r.primary_image ?? r.images?.[0],
    url: ozonProductUrl(sku),
    price,
    oldPrice,
    discountPct,
    stock,
    rating: null,
  };
}
