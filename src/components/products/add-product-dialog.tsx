"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatPrice, formatNumber } from "@/lib/utils";

interface PreviewCard {
  marketplace: "WB" | "OZON";
  externalId: string;
  title: string;
  imageUrl?: string;
  price: number | null;
  oldPrice?: number | null;
  stock: number | null;
  rating?: number | null;
}

export function AddProductDialog({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [keyword, setKeyword] = React.useState("");
  const [preview, setPreview] = React.useState<PreviewCard | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function reset() {
    setInput("");
    setKeyword("");
    setPreview(null);
    setError(null);
  }

  async function doPreview() {
    setError(null);
    setPreview(null);
    setLoading(true);
    try {
      const res = await fetch("/api/products/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error || "Не удалось получить карточку");
      else setPreview(json.data);
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setLoading(false);
    }
  }

  async function doAdd() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, searchKeyword: keyword || undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Не удалось добавить товар");
        return;
      }
      setOpen(false);
      reset();
      router.refresh();
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <Plus className="h-4 w-4" />
          Добавить товар
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Добавить товар</DialogTitle>
          <DialogDescription>
            Вставьте ссылку или артикул товара Wildberries либо Ozon.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="input">Ссылка или артикул</Label>
            <div className="flex gap-2">
              <Input
                id="input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="https://www.wildberries.ru/catalog/12345678/detail.aspx"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={doPreview}
                disabled={loading || input.length < 3}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Найти
              </Button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {preview && (
            <div className="flex gap-3 rounded-lg border p-3">
              {preview.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.imageUrl}
                  alt={preview.title}
                  className="h-20 w-20 rounded object-cover"
                />
              ) : (
                <div className="h-20 w-20 rounded bg-muted" />
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <Badge variant="secondary">{preview.marketplace}</Badge>
                <p className="line-clamp-2 text-sm font-medium">{preview.title}</p>
                <p className="text-sm">
                  <span className="font-semibold">{formatPrice(preview.price)}</span>
                  {preview.stock !== null && (
                    <span className="ml-2 text-muted-foreground">
                      Остаток: {formatNumber(preview.stock)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {preview && (
            <div className="space-y-1.5">
              <Label htmlFor="keyword">
                Ключевой запрос для отслеживания позиции (необязательно)
              </Label>
              <Input
                id="keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="например: кроссовки женские"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={doAdd}
            disabled={!preview || saving}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Добавить на мониторинг
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
