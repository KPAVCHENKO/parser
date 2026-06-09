import Link from "next/link";
import type { Metadata } from "next";
import {
  LineChart,
  Bell,
  Boxes,
  Search,
  Send,
  FileSpreadsheet,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PLANS, PLAN_ORDER } from "@/lib/plans";
import { formatPrice, cn } from "@/lib/utils";

export const metadata: Metadata = {
  description:
    "MarketPulse — мониторинг цен, остатков и позиций товаров на Wildberries и Ozon. Отслеживайте конкурентов, получайте уведомления в Telegram, выгружайте аналитику в Excel.",
  alternates: { canonical: "/" },
};

const FEATURES = [
  {
    icon: LineChart,
    title: "История цен и остатков",
    text: "Графики динамики за 7/30/90 дней по каждому товару и конкурентам.",
  },
  {
    icon: Search,
    title: "Позиции в поиске",
    text: "Отслеживайте позицию товара по ключевым запросам на WB.",
  },
  {
    icon: Boxes,
    title: "Конкуренты",
    text: "До 5 товаров-конкурентов на товар — сравнение цен и остатков.",
  },
  {
    icon: Bell,
    title: "Умные уведомления",
    text: "Конкурент снизил цену, товар закончился, позиция просела на N мест.",
  },
  {
    icon: Send,
    title: "Telegram-бот",
    text: "Мгновенные оповещения в Telegram и на email.",
  },
  {
    icon: FileSpreadsheet,
    title: "Выгрузка в Excel",
    text: "Экспорт истории и аналитики в .xlsx и CSV на тарифе Pro.",
  },
];

const STEPS = [
  {
    n: 1,
    title: "Добавьте товары",
    text: "Вставьте ссылку или артикул товара Wildberries либо Ozon — мы подтянем карточку.",
  },
  {
    n: 2,
    title: "Мы собираем данные",
    text: "Фоновый сервис по расписанию собирает цены, остатки и позиции в выдаче.",
  },
  {
    n: 3,
    title: "Следите и реагируйте",
    text: "Графики, сравнение с конкурентами и уведомления о важных изменениях.",
  },
];

const FAQ = [
  {
    q: "Как вы получаете данные с маркетплейсов?",
    a: "Мы используем официальные API и публичные данные карточек. Для точных остатков и продаж можно подключить свой токен WB и Ozon Seller API. Мы не обходим защиту площадок.",
  },
  {
    q: "Нужен ли токен селлера?",
    a: "Для Wildberries базовые данные карточек доступны без токена. Для Ozon нужен Client-Id и Api-Key из личного кабинета Ozon Seller. Свой токен WB добавляет точную статистику остатков.",
  },
  {
    q: "Чем отличаются тарифы?",
    a: "Количеством товаров, частотой обновления и фичами: Telegram-уведомления на Start и Pro, API-доступ и выгрузка в Excel — на Pro.",
  },
  {
    q: "Можно ли отменить подписку?",
    a: "Да, в любой момент в личном кабинете. Доступ сохранится до конца оплаченного периода, автопродление отключится.",
  },
  {
    q: "Есть ли бесплатный тариф?",
    a: "Да, Free навсегда: 5 товаров и обновление раз в сутки. Без карты.",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="container flex flex-col items-center gap-6 py-20 text-center md:py-28">
        <Badge variant="secondary" className="gap-1">
          Wildberries · Ozon
        </Badge>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Мониторинг цен и остатков на маркетплейсах
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Следите за конкурентами, ловите изменения цен и остатков, отслеживайте
          позиции в поиске и получайте уведомления в Telegram.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/register">
              Попробовать бесплатно <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="#pricing">Смотреть тарифы</a>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Free-тариф навсегда · без банковской карты
        </p>
      </section>

      {/* Как работает */}
      <section className="border-y bg-muted/30">
        <div className="container grid gap-8 py-16 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                {s.n}
              </div>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Возможности */}
      <section id="features" className="container py-20">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold">Возможности</h2>
          <p className="mt-2 text-muted-foreground">
            Всё для аналитики товаров на маркетплейсах.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <CardHeader>
                <f.icon className="h-8 w-8 text-primary" />
                <CardTitle className="text-lg">{f.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">{f.text}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Тарифы */}
      <section id="pricing" className="border-y bg-muted/30">
        <div className="container py-20">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold">Тарифы</h2>
            <p className="mt-2 text-muted-foreground">
              Годовая оплата — выгоднее на 20%.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {PLAN_ORDER.map((id) => {
              const p = PLANS[id];
              return (
                <Card
                  key={id}
                  className={cn(id === "PRO" && "border-primary shadow-lg")}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {p.name}
                      {id === "PRO" && <Badge>Популярный</Badge>}
                    </CardTitle>
                    <CardDescription>
                      <span className="text-3xl font-bold text-foreground">
                        {id === "FREE" ? "0 ₽" : formatPrice(p.price.month)}
                      </span>
                      {id !== "FREE" && (
                        <span className="text-muted-foreground"> / мес</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2 text-sm">
                      <Li>До {p.maxProducts} товаров</Li>
                      <Li>
                        Обновление{" "}
                        {p.refreshIntervalMinutes >= 1440
                          ? "раз в сутки"
                          : p.refreshIntervalMinutes >= 60
                            ? `каждые ${p.refreshIntervalMinutes / 60} ч`
                            : `каждые ${p.refreshIntervalMinutes} мин`}
                      </Li>
                      <Li on={p.features.telegram}>Telegram-уведомления</Li>
                      <Li on={p.features.apiAccess}>API-доступ</Li>
                      <Li on={p.features.export}>Выгрузка в Excel/CSV</Li>
                    </ul>
                    <Button
                      className="w-full"
                      variant={id === "PRO" ? "default" : "outline"}
                      asChild
                    >
                      <Link href="/register">
                        {id === "FREE" ? "Начать бесплатно" : "Выбрать тариф"}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container py-20">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold">Частые вопросы</h2>
        </div>
        <div className="mx-auto max-w-2xl space-y-3">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-lg border bg-card p-4"
            >
              <summary className="cursor-pointer list-none font-medium">
                {item.q}
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-primary/5">
        <div className="container flex flex-col items-center gap-4 py-16 text-center">
          <h2 className="text-3xl font-bold">Начните следить за конкурентами</h2>
          <p className="max-w-md text-muted-foreground">
            Бесплатный тариф навсегда. Подключите первый товар за минуту.
          </p>
          <Button size="lg" asChild>
            <Link href="/register">
              Создать аккаунт <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}

function Li({ children, on = true }: { children: React.ReactNode; on?: boolean }) {
  return (
    <li className={cn("flex items-center gap-2", !on && "text-muted-foreground line-through")}>
      <Check className={cn("h-4 w-4 shrink-0", on ? "text-success" : "text-muted-foreground")} />
      {children}
    </li>
  );
}
