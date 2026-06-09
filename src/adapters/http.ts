/**
 * HTTP-обёртка для адаптеров: таймаут, ретраи с экспоненциальным backoff,
 * корректная обработка 429/5xx. Никакого обхода защиты — только вежливые
 * повторы и уважение к Retry-After.
 */
import { AdapterError } from "./types";

const DEFAULT_TIMEOUT = 12_000;
const DEFAULT_RETRIES = 3;
const USER_AGENT =
  "MarketPulse/1.0 (+https://marketpulse.app; price monitoring)";

export interface FetchJsonOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Запрос JSON с ретраями. Бросает AdapterError при неудаче. */
export async function fetchJson<T = unknown>(
  url: string,
  options: FetchJsonOptions = {},
): Promise<T> {
  const {
    timeoutMs = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    headers,
    ...init
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
          ...headers,
        },
      });

      // Лимиты / временные ошибки — ретраим
      if (res.status === 429 || res.status >= 500) {
        const retryAfter = Number(res.headers.get("retry-after"));
        const backoff = Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : baseBackoff(attempt);
        lastError = new AdapterError(
          `HTTP ${res.status} от ${hostOf(url)}`,
          { retryable: true, status: res.status },
        );
        if (attempt < retries) {
          await sleep(backoff);
          continue;
        }
        throw lastError;
      }

      if (!res.ok) {
        throw new AdapterError(`HTTP ${res.status} от ${hostOf(url)}`, {
          retryable: false,
          status: res.status,
        });
      }

      return (await res.json()) as T;
    } catch (err) {
      if (err instanceof AdapterError && !err.opts.retryable) throw err;
      lastError =
        err instanceof Error ? err : new AdapterError("Сетевая ошибка");
      // Таймаут/сетевые — ретраим
      if (attempt < retries) {
        await sleep(baseBackoff(attempt));
        continue;
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw new AdapterError(
    `Не удалось получить данные: ${lastError?.message ?? "неизвестная ошибка"}`,
    { retryable: true },
  );
}

/** Экспоненциальный backoff с джиттером: 0.5s, 1s, 2s, ... */
function baseBackoff(attempt: number): number {
  const base = 500 * 2 ** attempt;
  const jitter = Math.random() * 250;
  return Math.min(base + jitter, 8_000);
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
