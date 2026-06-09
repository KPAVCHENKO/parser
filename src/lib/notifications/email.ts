/**
 * Отправка email через Resend.
 * Если RESEND_API_KEY не задан (dev) — логируем письмо в консоль вместо отправки.
 */
import { Resend } from "resend";
import { env } from "../env";

let client: Resend | null = null;

function getClient(): Resend | null {
  if (!env.email.resendApiKey) return null;
  if (!client) client = new Resend(env.email.resendApiKey);
  return client;
}

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendMail(msg: MailMessage): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.info(
      `[email:dev] To: ${msg.to}\nSubject: ${msg.subject}\n${msg.text ?? msg.html}`,
    );
    return true;
  }
  try {
    const { error } = await resend.emails.send({
      from: env.email.from,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text ?? "",
    });
    if (error) {
      console.error("[email] Resend вернул ошибку:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] Ошибка отправки:", err);
    return false;
  }
}

// ──────────────────────── Шаблоны ────────────────────────

function layout(title: string, body: string): string {
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
    <h1 style="font-size:20px;color:#4f46e5">MarketPulse</h1>
    <h2 style="font-size:16px">${title}</h2>
    ${body}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
    <p style="font-size:12px;color:#64748b">MarketPulse — мониторинг цен и остатков на Wildberries и Ozon.</p>
  </div>`;
}

export function magicLinkEmail(url: string): { subject: string; html: string; text: string } {
  return {
    subject: "Вход в MarketPulse",
    html: layout(
      "Ссылка для входа",
      `<p>Нажмите кнопку, чтобы войти. Ссылка действует 15 минут.</p>
       <p><a href="${url}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Войти в MarketPulse</a></p>
       <p style="font-size:12px;color:#64748b">Если вы не запрашивали вход — проигнорируйте письмо.</p>`,
    ),
    text: `Ссылка для входа в MarketPulse (действует 15 минут): ${url}`,
  };
}

export function welcomeEmail(verifyUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: "Добро пожаловать в MarketPulse",
    html: layout(
      "Подтвердите email",
      `<p>Вы зарегистрировались в MarketPulse. Подтвердите адрес:</p>
       <p><a href="${verifyUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Подтвердить email</a></p>`,
    ),
    text: `Подтвердите email в MarketPulse: ${verifyUrl}`,
  };
}
