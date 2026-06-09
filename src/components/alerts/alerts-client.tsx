"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Send, Bell, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";

type AlertType = "COMPETITOR_PRICE_DROP" | "OUT_OF_STOCK" | "POSITION_CHANGE";
type Channel = "TELEGRAM" | "EMAIL" | "BOTH";

interface Rule {
  id: string;
  type: AlertType;
  thresholdValue: number | null;
  channel: Channel;
  isActive: boolean;
  product: { id: string; title: string } | null;
}
interface Notif {
  id: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
}
interface ProductOpt {
  id: string;
  title: string;
}

const TYPE_LABEL: Record<AlertType, string> = {
  COMPETITOR_PRICE_DROP: "Конкурент снизил цену",
  OUT_OF_STOCK: "Товар закончился",
  POSITION_CHANGE: "Изменение позиции",
};
const CHANNEL_LABEL: Record<Channel, string> = {
  TELEGRAM: "Telegram",
  EMAIL: "Email",
  BOTH: "Telegram + Email",
};

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function AlertsClient({
  rules,
  products,
  notifications,
  telegramConnected,
  telegramAllowed,
}: {
  rules: Rule[];
  products: ProductOpt[];
  notifications: Notif[];
  telegramConnected: boolean;
  telegramAllowed: boolean;
}) {
  return (
    <div className="space-y-6">
      <TelegramCard connected={telegramConnected} allowed={telegramAllowed} />
      <CreateRule products={products} />
      <RulesList rules={rules} />
      <NotificationsList notifications={notifications} />
    </div>
  );
}

function TelegramCard({
  connected,
  allowed,
}: {
  connected: boolean;
  allowed: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function connect() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/telegram/link", { method: "POST" });
      const json = await res.json();
      if (res.ok && json.data?.deepLink) {
        window.open(json.data.deepLink, "_blank");
      } else {
        setError(json.error || "Не удалось создать ссылку");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-4 w-4" /> Telegram
          {connected && (
            <Badge variant="success" className="gap-1">
              <CheckCircle2 className="h-3 w-3" /> подключён
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {allowed
            ? "Получайте мгновенные уведомления в Telegram."
            : "Telegram-уведомления доступны на тарифах Start и Pro."}
        </CardDescription>
      </CardHeader>
      {allowed && (
        <CardContent className="flex flex-wrap items-center gap-2">
          <Button onClick={connect} disabled={loading} variant={connected ? "outline" : "default"}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {connected ? "Переподключить" : "Подключить Telegram"}
          </Button>
          {connected ? null : (
            <Button variant="ghost" onClick={() => router.refresh()}>
              Я подключил, обновить
            </Button>
          )}
          {error && <span className="text-sm text-destructive">{error}</span>}
        </CardContent>
      )}
    </Card>
  );
}

function CreateRule({ products }: { products: ProductOpt[] }) {
  const router = useRouter();
  const [type, setType] = React.useState<AlertType>("COMPETITOR_PRICE_DROP");
  const [channel, setChannel] = React.useState<Channel>("BOTH");
  const [productId, setProductId] = React.useState<string>("");
  const [threshold, setThreshold] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const needsThreshold = type !== "OUT_OF_STOCK";
  const thresholdLabel =
    type === "COMPETITOR_PRICE_DROP" ? "Падение цены, %" : "Сдвиг позиции, мест";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          channel,
          productId: productId || null,
          thresholdValue: needsThreshold && threshold ? Number(threshold) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error || "Ошибка");
      else {
        setThreshold("");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Новое правило</CardTitle>
        <CardDescription>
          Когда срабатывать и куда слать уведомление.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Событие</Label>
            <select
              className={selectClass}
              value={type}
              onChange={(e) => setType(e.target.value as AlertType)}
            >
              {Object.entries(TYPE_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Товар</Label>
            <select
              className={selectClass}
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Все товары</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title.slice(0, 40)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>{needsThreshold ? thresholdLabel : "Порог"}</Label>
            <Input
              type="number"
              min={0}
              disabled={!needsThreshold}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder={needsThreshold ? "напр. 5" : "—"}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Канал</Label>
            <select
              className={selectClass}
              value={channel}
              onChange={(e) => setChannel(e.target.value as Channel)}
            >
              {Object.entries(CHANNEL_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-4">
            {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Создать правило
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function RulesList({ rules }: { rules: Rule[] }) {
  const router = useRouter();

  async function toggle(id: string, isActive: boolean) {
    await fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    router.refresh();
  }
  async function remove(id: string) {
    await fetch(`/api/alerts/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Правила ({rules.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rules.length === 0 && (
          <p className="text-sm text-muted-foreground">Правил пока нет.</p>
        )}
        {rules.map((r) => (
          <div
            key={r.id}
            className="flex flex-wrap items-center gap-2 rounded-md border p-3 text-sm"
          >
            <Badge variant={r.isActive ? "default" : "secondary"}>
              {TYPE_LABEL[r.type]}
            </Badge>
            {r.thresholdValue !== null && (
              <span className="text-muted-foreground">
                порог: {r.thresholdValue}
                {r.type === "COMPETITOR_PRICE_DROP" ? "%" : " мест"}
              </span>
            )}
            <span className="text-muted-foreground">
              · {r.product ? r.product.title.slice(0, 30) : "Все товары"}
            </span>
            <span className="text-muted-foreground">· {CHANNEL_LABEL[r.channel]}</span>
            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggle(r.id, !r.isActive)}
              >
                {r.isActive ? "Выключить" : "Включить"}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => remove(r.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function NotificationsList({ notifications }: { notifications: Notif[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4" /> История уведомлений
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {notifications.length === 0 && (
          <p className="text-sm text-muted-foreground">Уведомлений пока нет.</p>
        )}
        {notifications.map((n) => (
          <div key={n.id} className="rounded-md border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{n.title}</span>
              <Badge
                variant={
                  n.status === "SENT"
                    ? "success"
                    : n.status === "FAILED"
                      ? "destructive"
                      : "secondary"
                }
                className="shrink-0"
              >
                {n.status === "SENT"
                  ? "отправлено"
                  : n.status === "FAILED"
                    ? "ошибка"
                    : "в очереди"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{n.message}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDate(n.createdAt)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
