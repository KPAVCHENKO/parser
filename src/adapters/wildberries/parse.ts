/**
 * Чистые функции парсинга Wildberries (без сети) — удобно тестировать.
 */
import type { NormalizedCard, ParsedInput, PositionResult } from "../types";

const WB_URL = "https://www.wildberries.ru/catalog";

/** Распознаёт nmId из ссылки WB или из «голого» артикула. */
export function parseWbInput(input: string): ParsedInput | null {
  const trimmed = input.trim();

  // Голый артикул (nmId)
  if (/^\d{4,12}$/.test(trimmed)) {
    return { marketplace: "WB", externalId: trimmed };
  }

  // Ссылка вида wildberries.ru/catalog/{nmId}/detail.aspx
  if (/wildberries\.|wb\.ru/i.test(trimmed)) {
    const m = trimmed.match(/catalog\/(\d{4,12})/);
    if (m) return { marketplace: "WB", externalId: m[1] };
    // ?card=... или /product?...nm=
    const nm = trimmed.match(/[?&]nm=(\d{4,12})/);
    if (nm) return { marketplace: "WB", externalId: nm[1] };
  }
  return null;
}

export function wbProductUrl(nmId: string): string {
  return `${WB_URL}/${nmId}/detail.aspx`;
}

/**
 * Вычисляет хост basket-CDN для картинки по vol.
 * Маппинг WB периодически расширяется; при промахе картинка просто не загрузится.
 */
function basketHost(vol: number): string {
  const ranges: Array<[number, number]> = [
    [143, 1], [287, 2], [431, 3], [719, 4], [1007, 5], [1061, 6],
    [1115, 7], [1169, 8], [1313, 9], [1601, 10], [1655, 11], [1919, 12],
    [2045, 13], [2189, 14], [2405, 15], [2621, 16], [2837, 17], [3053, 18],
    [3269, 19], [3485, 20], [3701, 21], [3917, 22], [4133, 23], [4349, 24],
    [4565, 25],
  ];
  for (const [max, host] of ranges) {
    if (vol <= max) return String(host).padStart(2, "0");
  }
  // Для новых томов — оценочно (растёт примерно на 1 каждые ~216 vol)
  const extra = 26 + Math.floor((vol - 4565) / 216);
  return String(extra).padStart(2, "0");
}

/** Строит URL основного изображения товара по nmId. */
export function buildWbImageUrl(nmId: string): string {
  const id = Number(nmId);
  const vol = Math.floor(id / 100000);
  const part = Math.floor(id / 1000);
  const host = basketHost(vol);
  return `https://basket-${host}.wbbasket.ru/vol${vol}/part${part}/${id}/images/big/1.webp`;
}

// Минимальные типы ответа card.wb.ru
interface WbPrice {
  basic?: number;
  product?: number;
  total?: number;
}
interface WbSize {
  price?: WbPrice;
  stocks?: Array<{ qty?: number }>;
}
interface WbProduct {
  id: number;
  name?: string;
  brand?: string;
  rating?: number;
  reviewRating?: number;
  priceU?: number;
  salePriceU?: number;
  totalQuantity?: number;
  sizes?: WbSize[];
}
export interface WbDetailResponse {
  data?: { products?: WbProduct[] };
}

const kopToRub = (v?: number | null): number | null =>
  v === undefined || v === null ? null : Math.round(v) / 100;

/** Нормализует ответ card.wb.ru в NormalizedCard. */
export function parseWbCard(
  json: WbDetailResponse,
  nmId: string,
): NormalizedCard {
  const p = json.data?.products?.[0];
  if (!p) {
    throw new Error("Товар не найден в ответе Wildberries");
  }

  // Цена: приоритет sizes[].price (актуальный формат), затем salePriceU/priceU
  const sizePrice = p.sizes?.find((s) => s.price)?.price;
  const sale =
    kopToRub(sizePrice?.product ?? sizePrice?.total) ?? kopToRub(p.salePriceU);
  const old = kopToRub(sizePrice?.basic) ?? kopToRub(p.priceU);

  const discountPct =
    sale !== null && old !== null && old > 0 && old > sale
      ? Math.round((1 - sale / old) * 100)
      : null;

  // Остаток: сумма qty по всем размерам, иначе totalQuantity
  let stock: number | null = null;
  if (p.sizes?.length) {
    stock = p.sizes.reduce(
      (sum, s) =>
        sum + (s.stocks?.reduce((a, b) => a + (b.qty ?? 0), 0) ?? 0),
      0,
    );
  }
  if (stock === null && typeof p.totalQuantity === "number") {
    stock = p.totalQuantity;
  }

  return {
    marketplace: "WB",
    externalId: nmId,
    title: p.name ?? `Товар ${nmId}`,
    brand: p.brand,
    imageUrl: buildWbImageUrl(nmId),
    url: wbProductUrl(nmId),
    price: sale,
    oldPrice: old,
    discountPct,
    stock,
    rating: p.reviewRating ?? p.rating ?? null,
  };
}

interface WbSearchResponse {
  data?: { products?: Array<{ id: number }> };
}

/** Находит позицию nmId в одной странице поисковой выдачи. */
export function parseWbSearchPosition(
  json: WbSearchResponse,
  nmId: string,
  page: number,
  pageSize = 100,
): PositionResult {
  const products = json.data?.products ?? [];
  const idx = products.findIndex((x) => String(x.id) === nmId);
  if (idx === -1) {
    return { keyword: "", position: null, page: null };
  }
  return {
    keyword: "",
    position: (page - 1) * pageSize + idx + 1,
    page,
  };
}
