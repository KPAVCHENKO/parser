"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Loader2,
  Plus,
  Trash2,
  ExternalLink,
  Save,
} from "lucide-react";
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
import { formatPrice, formatNumber, formatDate } from "@/lib/utils";
import { HistoryChart } from "./history-chart";

export interface DetailProduct {
  id: string;
  marketplace: "WB" | "OZON";
  title: string;
  url: string;
  imageUrl: string | null;
  searchKeyword: string | null;
  lastPrice: number | null;
  lastStock: number | null;
  lastPosition: number | null;
  rating: number | null;
  lastStatus: "PENDING" | "OK" | "FAILED";
  lastError: string | null;
  lastCheckedAt: string | null;
}

export interface DetailCompetitor {
  id: string;
  marketplace: "WB" | "OZON";
  title: string;
  url: string;
  imageUrl: string | null;
  lastPrice: number | null;
  lastStock: number | null;
}

export function ProductDetail({
  product,
  competitors,
  maxCompetitors,
}: {
  product: DetailProduct;
  competitors: DetailCompetitor[];
  maxCompetitors: number;
}) {
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);
  const [keyword, setKeyword] = React.useState(product.searchKeyword ?? "");
  const [savingKw, setSavingKw] = React.useState(false);
  const [compInput, setCompInput] = React.useState("");
  const [addingComp, setAddingComp] = React.useState(false);
  const [compError, setCompError] = React.useState<string | null>(null);

  async function refresh() {
    setRefreshing(true);
    try {
      await fetch(`/api/products/${product.id}/refresh`, { method: "POST" });
      router.refresh();
    } finally {
      setRefreshing(false);
    }
  }

  async function saveKeyword() {
    setSavingKw(true);
    try {
      await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchKeyword: keyword || null }),
      });
      router.refresh();
    } finally {
      setSavingKw(false);
    }
  }

  async function addCompetitor() {
    setAddingComp(true);
    setCompError(null);
    try {
      const res = await fetch(`/api/products/${product.id}/competitors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: compInput }),
      });
      const json = await res.json();
      if (!res.ok) setCompError(json.error || "Не удалось добавить конкурента");
      else {
        setCompInput("");
        router.refresh();
      }
    } finally {
      setAddingComp(false);
    }
  }

  async function removeCompetitor(id: string) {
    await fetch(`/api/competitors/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Шапка товара */}
      <div className="flex flex-wrap items-start gap-4">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.title}
            className="h-28 w-28 rounded-lg object-cover"
          />
        ) : (
          <div className="h-28 w-28 rounded-lg bg-muted" />
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <Badge variant="secondary">{product.marketplace}</Badge>
          <h1 className="text-xl font-bold">{product.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="text-lg font-semibold">
              {formatPrice(product.lastPrice)}
            </span>
            <span className="text-muted-foreground">
              Остаток: {formatNumber(product.lastStock)}
            </span>
            {product.lastPosition !== null && (
              <span className="text-muted-foreground">
                Позиция: {product.lastPosition}
              </span>
            )}
            {product.rating !== null && (
              <span className="text-muted-foreground">★ {product.rating}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Обновлён:{" "}
            {product.lastCheckedAt ? formatDate(product.lastCheckedAt) : "—"}
            {product.lastStatus === "FAILED" && product.lastError && (
              <span className="text-destructive"> · {product.lastError}</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href={product.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" /> На маркетплейсе
            </a>
          </Button>
          <Button onClick={refresh} disabled={refreshing}>
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Обновить
          </Button>
        </div>
      </div>

      {/* Ключевой запрос */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Отслеживание позиции</CardTitle>
          <CardDescription>
            Ключевой запрос, по которому отслеживается позиция в выдаче.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="например: кроссовки женские"
            />
            <Button variant="secondary" onClick={saveKeyword} disabled={savingKw}>
              {savingKw ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Сохранить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Динамика: цена / остаток / позиция за 7/30/90 дней */}
      <Card id="history">
        <CardHeader>
          <CardTitle className="text-base">Динамика</CardTitle>
          <CardDescription>
            Цена, остатки и позиция в выдаче. Конкуренты наложены на график цены и
            остатков.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HistoryChart productId={product.id} />
        </CardContent>
      </Card>

      {/* Конкуренты */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Конкуренты ({competitors.length}/{maxCompetitors})
          </CardTitle>
          <CardDescription>
            Добавьте товары-конкуренты для сравнения цен и остатков.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {competitors.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Конкуренты ещё не добавлены.
              </p>
            )}
            {competitors.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-md border p-2"
              >
                {c.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.imageUrl}
                    alt=""
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(c.lastPrice)} · остаток{" "}
                    {formatNumber(c.lastStock)}
                  </p>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <a href={c.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCompetitor(c.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          {competitors.length < maxCompetitors && (
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <Input
                  value={compInput}
                  onChange={(e) => setCompInput(e.target.value)}
                  placeholder="Ссылка или артикул конкурента"
                />
                <Button
                  onClick={addCompetitor}
                  disabled={addingComp || compInput.length < 3}
                >
                  {addingComp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Добавить
                </Button>
              </div>
              {compError && (
                <p className="text-sm text-destructive">{compError}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
