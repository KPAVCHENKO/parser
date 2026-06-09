/**
 * Шифрование секретов маркетплейсов (WB-токен, Ozon Client-Id/Api-Key).
 * AES-256-GCM. Ключ — ENCRYPTION_KEY (32 байта в hex).
 */
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from "node:crypto";
import { env } from "./env";

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const hex = env.encryptionKey;
  // Поддерживаем как 64-символьный hex (32 байта), так и произвольную строку
  if (/^[0-9a-fA-F]{64}$/.test(hex)) {
    return Buffer.from(hex, "hex");
  }
  // Фолбэк: производный ключ из строки (для dev), но предупреждаем
  return createHash("sha256").update(hex).digest();
}

/** Шифрует строку → "iv:authTag:ciphertext" (base64) */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

/** Расшифровывает "iv:authTag:ciphertext" → исходная строка */
export function decrypt(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Некорректный формат зашифрованных данных");
  }
  const decipher = createDecipheriv(
    ALGO,
    getKey(),
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

/** SHA-256 хэш (для токенов magic-link, которые не храним в открытом виде) */
export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/** Криптографически стойкий случайный токен (url-safe) */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}
