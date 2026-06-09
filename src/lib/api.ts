/**
 * Хелперы для API route handlers: единый формат ответов и обработка ошибок.
 */
import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { getCurrentUser } from "./auth/session";
import { ApiError } from "./errors";

export { ApiError };

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function fail(message: string, status = 400, extra?: unknown) {
  return NextResponse.json({ error: message, details: extra }, { status });
}

/** Парсит и валидирует JSON-тело запроса через Zod. */
export async function parseBody<T>(
  req: Request,
  schema: ZodSchema<T>,
): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new ApiError("Некорректный JSON в теле запроса", 400);
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    throw new ApiError(formatZodError(result.error), 422);
  }
  return result.data;
}

function formatZodError(err: ZodError): string {
  return err.errors
    .map((e) => `${e.path.join(".") || "поле"}: ${e.message}`)
    .join("; ");
}

/** Требует авторизованного пользователя. */
export async function authUser() {
  const user = await getCurrentUser();
  if (!user) throw new ApiError("Требуется авторизация", 401);
  return user;
}

/** Оборачивает handler: ловит ApiError/ZodError и отдаёт корректный ответ. */
export function handler(
  fn: (req: Request, ctx: { params: Record<string, string> }) => Promise<Response>,
) {
  return async (req: Request, ctx: { params: Record<string, string> }) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      // Служебные ошибки Next (динамический рендер, redirect) пробрасываем
      if (
        err &&
        typeof err === "object" &&
        "digest" in err &&
        typeof (err as { digest?: string }).digest === "string" &&
        ((err as { digest: string }).digest === "DYNAMIC_SERVER_USAGE" ||
          (err as { digest: string }).digest.startsWith("NEXT_REDIRECT"))
      ) {
        throw err;
      }
      if (err instanceof ApiError) return fail(err.message, err.status);
      if (err instanceof ZodError) return fail(formatZodError(err), 422);
      if (err instanceof Error && err.message === "UNAUTHORIZED") {
        return fail("Требуется авторизация", 401);
      }
      console.error("[api] Необработанная ошибка:", err);
      return fail("Внутренняя ошибка сервера", 500);
    }
  };
}
