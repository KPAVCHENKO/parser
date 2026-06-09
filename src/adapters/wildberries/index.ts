import type {
  AdapterCredentials,
  MarketplaceAdapter,
  NormalizedCard,
  ParsedInput,
  PositionResult,
} from "../types";
import { AdapterError } from "../types";
import { fetchJson } from "../http";
import {
  parseWbInput,
  parseWbCard,
  parseWbSearchPosition,
  type WbDetailResponse,
} from "./parse";

const CARD_API = "https://card.wb.ru/cards/v2/detail";
const SEARCH_API = "https://search.wb.ru/exactmatch/ru/common/v5/search";
// Регион доставки (Москва) — для публичных эндпоинтов WB
const DEST = "-1257786";

export class WildberriesAdapter implements MarketplaceAdapter {
  readonly marketplace = "WB" as const;

  matchInput(input: string): ParsedInput | null {
    return parseWbInput(input);
  }

  async fetchCard(
    externalId: string,
    _creds?: AdapterCredentials,
  ): Promise<NormalizedCard> {
    const url = `${CARD_API}?appType=1&curr=rub&dest=${DEST}&spp=30&nm=${externalId}`;
    const json = await fetchJson<WbDetailResponse>(url);
    const card = parseWbCard(json, externalId);
    if (card.price === null && card.stock === null) {
      // Пустая карточка — вероятно, товар снят с продажи
      throw new AdapterError("Товар недоступен на Wildberries", {
        retryable: false,
        status: 404,
      });
    }
    return card;
  }

  async fetchPosition(
    externalId: string,
    keyword: string,
    maxPages = 5,
  ): Promise<PositionResult> {
    const pageSize = 100;
    for (let page = 1; page <= maxPages; page++) {
      const url =
        `${SEARCH_API}?appType=1&curr=rub&dest=${DEST}&resultset=catalog` +
        `&sort=popular&spp=30&suppressSpellcheck=false&page=${page}` +
        `&query=${encodeURIComponent(keyword)}`;
      const json = await fetchJson<{ data?: { products?: Array<{ id: number }> } }>(
        url,
      );
      const found = parseWbSearchPosition(json, externalId, page, pageSize);
      if (found.position !== null) {
        return { ...found, keyword };
      }
      // Если страница пустая — дальше искать смысла нет
      if (!json.data?.products?.length) break;
    }
    return { keyword, position: null, page: null };
  }
}

export const wildberriesAdapter = new WildberriesAdapter();
