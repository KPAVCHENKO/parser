import { NextResponse } from "next/server";
import { consumeToken } from "@/lib/auth/tokens";
import { createSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(`${env.appUrl}/login?error=invalid_link`);
  }

  const userId = await consumeToken(token, "MAGIC_LINK");
  if (!userId) {
    return NextResponse.redirect(`${env.appUrl}/login?error=expired_link`);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() }, // вход по ссылке = email подтверждён
  });

  await createSession({ sub: user.id, email: user.email, role: user.role });
  return NextResponse.redirect(`${env.appUrl}/app`);
}
