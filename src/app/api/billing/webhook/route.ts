import { NextResponse } from "next/server";
import { handleWebhook } from "@/server/services/billing";

/**
 * Webhook ЮKassa. Тело не подписано провайдером — внутри handleWebhook статус
 * платежа перепроверяется запросом к API ЮKassa. Возвращаем 200 на обработанные
 * события, 500 — на временные сбои (ЮKassa повторит доставку).
 */
export async function POST(req: Request) {
  let body: { event?: string; object?: { id?: string } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const paymentId = body.object?.id;
  if (!paymentId) {
    return NextResponse.json({ ok: true }); // нечего обрабатывать
  }

  try {
    await handleWebhook(paymentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[billing:webhook] ошибка:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
