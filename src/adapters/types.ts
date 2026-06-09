/**
 * Слой адаптеров маркетплейсов.
 * Адаптер НЕ знает про БД и бизнес-логику — только как достать и нормализовать
 * данные из конкретного маркетплейса. Новый маркетплейс = новый адаптер + строка
 * в registry.ts.
 */
import type { Marketplace } from "@prisma/client";

/** Нормализованная карточка товара — единый формат для всех маркетплейсов. */
export interface NormalizedCard {
  marketplace: Marketplace;
  externalId: string;
  title: string;
  brand?: string;
  imageUrl?: string;
  url: string;
  /** Текущая цена в рублях (после скидок) */
  price: number | null;
  /** Цена до скидки */
  oldPrice?: number | null;
  /** Процент скидки */
  discountPct?: number | null;
  /** Остаток (суммарно) */
  stock: number | null;
  /** Рейтинг 0..5 */
  rating?: number | null;
}

/** Результат проверки позиции в поисковой выдаче по ключевому запросу. */
export interface PositionResult {
  keyword: string;
  /** Позиция (1-based) или null, если не найден в просканированных страницах */
  position: number | null;
  page: number | null;
}

/** Распознанный из ввода (ссылка/артикул) идентификатор. */
export interface ParsedInput {
  marketplace: Marketplace;
  externalId: string;
}

/** Учётные данные селлера для приватных API (расшифрованные). */
export interface AdapterCredentials {
  /** WB: токен статистики. Ozon: не используется (см. clientId/apiKey). */
  token?: string;
  /** Ozon Client-Id */
  clientId?: string;
  /** Ozon Api-Key */
  apiKey?: string;
}

/** Ошибка адаптера с признаком возможности ретрая. */
export class AdapterError extends Error {
  constructor(
    message: string,
    public readonly opts: {
      retryable?: boolean;
      status?: number;
      needsCredentials?: boolean;
    } = {},
  ) {
    super(message);
    this.name = "AdapterError";
  }
}

export interface MarketplaceAdapter {
  readonly marketplace: Marketplace;

  /** Распознаёт ссылку или артикул. Возвращает null, если не подходит. */
  matchInput(input: string): ParsedInput | null;

  /** Тянет карточку товара. creds — опционально (для приватных данных). */
  fetchCard(
    externalId: string,
    creds?: AdapterCredentials,
  ): Promise<NormalizedCard>;

  /** Позиция товара в выдаче по ключевому запросу (опционально). */
  fetchPosition?(
    externalId: string,
    keyword: string,
    maxPages?: number,
  ): Promise<PositionResult>;

  /** Проверка валидности учётных данных селлера. */
  validateCredentials?(creds: AdapterCredentials): Promise<boolean>;
}
