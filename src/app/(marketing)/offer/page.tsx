import type { Metadata } from "next";
import { env } from "@/lib/env";
import { PLANS } from "@/lib/plans";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Публичная оферта",
  robots: { index: true, follow: true },
};

export default function OfferPage() {
  // Реквизиты подставляются из переменных окружения на проде.
  const name = env.legal.entityName || "«Исполнитель»";
  const email = env.legal.email || "support@marketpulse.app";
  const inn = env.legal.inn;
  const address = env.legal.address;
  const date = new Date().toLocaleDateString("ru-RU");

  return (
    <article className="container prose-sm mx-auto max-w-3xl py-12">
      <h1 className="text-3xl font-bold">Публичная оферта</h1>
      <p className="mt-2 text-sm text-muted-foreground">Редакция от {date}</p>

      <div className="mt-6 space-y-4 text-sm leading-relaxed text-foreground/90">
        <Section title="1. Общие положения">
          Настоящий документ является публичной офертой {name} (далее —
          Исполнитель) и содержит условия предоставления доступа к
          онлайн-сервису MarketPulse (далее — Сервис). Акцептом оферты является
          регистрация в Сервисе и/или оплата подписки.
        </Section>

        <Section title="2. Предмет">
          Исполнитель предоставляет Пользователю доступ к функциональности
          Сервиса для мониторинга цен, остатков и позиций товаров на
          маркетплейсах на условиях выбранного тарифа. Сервис использует
          официальные API и публично доступные данные площадок.
        </Section>

        <Section title="3. Тарифы и оплата">
          <ul className="ml-5 list-disc space-y-1">
            <li>Free — 0 ₽, {PLANS.FREE.maxProducts} товаров, обновление раз в сутки.</li>
            <li>
              Start — {formatPrice(PLANS.START.price.month)}/мес, до{" "}
              {PLANS.START.maxProducts} товаров.
            </li>
            <li>
              Pro — {formatPrice(PLANS.PRO.price.month)}/мес, до{" "}
              {PLANS.PRO.maxProducts} товаров, API и выгрузка.
            </li>
          </ul>
          Оплата производится через платёжный сервис ЮKassa. Подписка
          продлевается автоматически; автопродление можно отключить в личном
          кабинете в любой момент. При годовой оплате предоставляется скидка 20%.
        </Section>

        <Section title="4. Возврат средств">
          Возврат за неиспользованный период осуществляется по обращению на{" "}
          {email} в соответствии с законодательством РФ.
        </Section>

        <Section title="5. Обязанности и ограничения">
          Пользователь обязуется не использовать Сервис для действий, нарушающих
          правила маркетплейсов или законодательство. Исполнитель не гарантирует
          бесперебойность сторонних API и не несёт ответственности за решения,
          принятые на основании данных Сервиса.
        </Section>

        <Section title="6. Реквизиты">
          <p>{name}</p>
          {inn && <p>ИНН: {inn}</p>}
          {address && <p>Адрес: {address}</p>}
          <p>E-mail: {email}</p>
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
