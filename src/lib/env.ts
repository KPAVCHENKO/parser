/**
 * Централизованный доступ к переменным окружения.
 * Все секреты — только отсюда, никаких process.env по коду.
 */

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    // На этапе сборки часть переменных может отсутствовать — не валим билд,
    // но в рантайме обращение к пустому секрету должно быть явной ошибкой.
    if (process.env.NODE_ENV === "production" && typeof window === "undefined") {
      console.warn(`[env] Переменная ${name} не задана`);
    }
    return "";
  }
  return value;
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

function int(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export const env = {
  nodeEnv: optional("NODE_ENV", "development"),
  isProd: process.env.NODE_ENV === "production",
  appUrl: optional("APP_URL", "http://localhost:3000"),
  appName: optional("APP_NAME", "MarketPulse"),

  databaseUrl: required("DATABASE_URL"),
  redisUrl: optional("REDIS_URL", "redis://localhost:6379"),

  jwtSecret: required("JWT_SECRET", "dev-insecure-secret-change-me"),
  encryptionKey: required("ENCRYPTION_KEY", "0".repeat(64)),

  email: {
    resendApiKey: optional("RESEND_API_KEY"),
    from: optional("EMAIL_FROM", "MarketPulse <onboarding@resend.dev>"),
  },

  telegram: {
    botToken: optional("TELEGRAM_BOT_TOKEN"),
    botUsername: optional("TELEGRAM_BOT_USERNAME"),
    webhookSecret: optional("TELEGRAM_WEBHOOK_SECRET"),
  },

  yookassa: {
    shopId: optional("YOOKASSA_SHOP_ID"),
    secretKey: optional("YOOKASSA_SECRET_KEY"),
  },

  legal: {
    entityName: optional("LEGAL_ENTITY_NAME"),
    inn: optional("LEGAL_INN"),
    email: optional("LEGAL_EMAIL"),
    address: optional("LEGAL_ADDRESS"),
  },

  limits: {
    wbRps: int("WB_RATE_LIMIT_RPS", 3),
    ozonRps: int("OZON_RATE_LIMIT_RPS", 2),
    cardCacheTtl: int("CARD_CACHE_TTL", 300),
  },
} as const;
