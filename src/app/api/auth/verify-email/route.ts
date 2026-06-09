import { NextResponse } from "next/server";
import { consumeToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(`${env.appUrl}/login?error=invalid_link`);
  }

  const userId = await consumeToken(token, "EMAIL_VERIFY");
  if (!userId) {
    return NextResponse.redirect(`${env.appUrl}/app?email=verify_failed`);
  }

  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() },
  });

  return NextResponse.redirect(`${env.appUrl}/app?email=verified`);
}
