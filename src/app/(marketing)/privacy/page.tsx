import type { Metadata } from "next";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  const name = env.legal.entityName || "Оператор Сервиса";
  const email = env.legal.email || "support@marketpulse.app";
  const date = new Date().toLocaleDateString("ru-RU");

  return (
    <article className="container mx-auto max-w-3xl py-12">
      <h1 className="text-3xl font-bold">Политика обработки персональных данных</h1>
      <p className="mt-2 text-sm text-muted-foreground">Редакция от {date}</p>

      <div className="mt-6 space-y-4 text-sm leading-relaxed">
        <Section title="1. Оператор">
          Оператором персональных данных является {name} (далее — Оператор).
          Настоящая Политика определяет порядок обработки персональных данных
          пользователей сервиса MarketPulse.
        </Section>

        <Section title="2. Какие данные мы обрабатываем">
          <ul className="ml-5 list-disc space-y-1">
            <li>Адрес электронной почты и имя (при регистрации).</li>
            <li>Идентификатор Telegram-чата (при подключении уведомлений).</li>
            <li>Токены маркетплейсов — хранятся в зашифрованном виде.</li>
            <li>Технические данные: журналы запросов, cookie сессии.</li>
            <li>Платёжные данные обрабатываются на стороне ЮKassa; карты мы не храним.</li>
          </ul>
        </Section>

        <Section title="3. Цели обработки">
          Предоставление доступа к Сервису, аутентификация, отправка уведомлений,
          биллинг и улучшение качества сервиса.
        </Section>

        <Section title="4. Хранение и защита">
          Данные хранятся на серверах в защищённой инфраструктуре. Секреты и
          токены шифруются. Доступ ограничен. Срок хранения — до удаления
          аккаунта или отзыва согласия.
        </Section>

        <Section title="5. Передача третьим лицам">
          Мы не продаём персональные данные. Передача возможна платёжному
          провайдеру (ЮKassa) и поставщику email-рассылки исключительно для
          оказания услуги.
        </Section>

        <Section title="6. Права пользователя">
          Вы вправе запросить доступ, исправление или удаление своих данных,
          отозвать согласие, написав на {email}.
        </Section>

        <Section title="7. Cookie">
          Используются технические cookie для авторизации (сессия). Аналитические
          cookie применяются только при наличии согласия.
        </Section>
      </div>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="text-muted-foreground">{children}</div>
    </section>
  );
}
