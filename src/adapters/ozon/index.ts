import type {
  AdapterCredentials,
  MarketplaceAdapter,
  NormalizedCard,
  ParsedInput,
} from "../types";
import { AdapterError } from "../types";
import { fetchJson } from "../http";
import {
  parseOzonInput,
  parseOzonProductInfo,
  type OzonProductInfo,
} from "./parse";

const API = "https://api-seller.ozon.ru";

export class OzonAdapter implements MarketplaceAdapter {
  readonly marketplace = "OZON" as const;

  matchInput(input: string): ParsedInput | null {
    return parseOzonInput(input);
  }

  async fetchCard(
    externalId: string,
    creds?: AdapterCredentials,
  ): Promise<NormalizedCard> {
    if (!creds?.clientId || !creds?.apiKey) {
      throw new AdapterError(
        "Для Ozon нужен токен селлера (Client-Id и Api-Key). Добавьте его в настройках.",
        { needsCredentials: true, retryable: false },
      );
    }

    const json = await fetchJson<OzonProductInfo>(`${API}/v2/product/info`, {
      method: "POST",
      headers: {
        "Client-Id": creds.clientId,
        "Api-Key": creds.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sku: Number(externalId) }),
    });

    return parseOzonProductInfo(json, externalId);
  }

  async validateCredentials(creds: AdapterCredentials): Promise<boolean> {
    if (!creds.clientId || !creds.apiKey) return false;
    try {
      // Лёгкий запрос на список товаров — проверка доступа
      await fetchJson(`${API}/v2/category/tree`, {
        method: "POST",
        headers: {
          "Client-Id": creds.clientId,
          "Api-Key": creds.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ language: "RU" }),
        retries: 1,
      });
      return true;
    } catch {
      return false;
    }
  }
}

export const ozonAdapter = new OzonAdapter();
