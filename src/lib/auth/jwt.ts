import { SignJWT, jwtVerify } from "jose";
import { env } from "../env";

const secret = new TextEncoder().encode(env.jwtSecret);
const ISSUER = "marketpulse";
const ALG = "HS256";

/** Имя cookie сессии. Здесь — чтобы было доступно в edge-middleware без Prisma. */
export const SESSION_COOKIE = "mp_session";

export interface SessionPayload {
  sub: string; // userId
  email: string;
  role: "USER" | "ADMIN";
}

export async function signSession(
  payload: SessionPayload,
  expiresIn = "30d",
): Promise<string> {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.sub)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function verifySession(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { issuer: ISSUER });
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      email: (payload.email as string) ?? "",
      role: (payload.role as "USER" | "ADMIN") ?? "USER",
    };
  } catch {
    return null;
  }
}
