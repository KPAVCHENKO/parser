"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  RefreshCw,
  Trash2,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice, formatNumber, formatDate, cn } from "@/lib/utils";

export interface ProductRow {
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
  competitorsCount: number;
}

type SortKey = "title" | "lastPrice" | "lastStock" | "lastPosition" | "lastCheckedAt";

export function ProductsTable({ products }: { products: ProductRow[] }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [mp, setMp] = React.useState<"ALL" | "WB" | "OZON">("ALL");
  const [status, setStatus] = React.useState<"ALL" | "OK" | "FAILED">("ALL");
  const [sortKey, setSortKey] = React.useState<SortKey>("lastCheckedAt");
  const [asc, setAsc] = React.useState(false);
  const [busy, setBusy] = React.useState<string | null>(null);

  const rows = React.useMemo(() => {
    let r = products.filter((p) => {
      if (mp !== "ALL" && p.marketplace !== mp) return false;
      if (status !== "ALL" && p.lastStatus !== status) return false;
      if (query && !p.title.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    });
    r = [...r].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (va === null) return 1;
      if (vb === null) return -1;
      if (va < vb) return asc ? -1 : 1;
      if (va > vb) return asc ? 1 : -1;
      return 0;
    });
    return r;
  }, [products, mp, status, query, sortKey, asc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setAsc((v) => !v);
    else {
      setSortKey(key);
      setAsc(true);
    }
  }

  async function refresh(id: string) {
    setBusy(id);
    try {
      await fetch(`/api/products/${id}/refresh`, { method: "POST" });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Удалить товар и всю его историю?")) return;
    setBusy(id);
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Поиск по названию…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <FilterChips
          value={mp}
          onChange={(v) => setMp(v as typeof mp)}
          options={[
            ["ALL", "Все"],
            ["WB", "WB"],
            ["OZON", "Ozon"],
          ]}
        />
        <FilterChips
          value={status}
          onChange={(v) => setStatus(v as typeof status)}
          options={[
            ["ALL", "Любой статус"],
            ["OK", "Обновлён"],
            ["FAILED", "Ошибка"],
          ]}
        />
      </div>

      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Нет товаров под фильтр. Добавьте первый товар.
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Товар</TableHead>
                <SortableHead label="Цена" k="lastPrice" {...{ sortKey, toggleSort }} />
                <SortableHead label="Остаток" k="lastStock" {...{ sortKey, toggleSort }} />
                <SortableHead label="Позиция" k="lastPosition" {...{ sortKey, toggleSort }} />
                <TableHead>Статус</TableHead>
                <SortableHead label="Обновлён" k="lastCheckedAt" {...{ sortKey, toggleSort }} />
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 shrink-0 rounded bg-muted" />
                      )}
                      <div className="min-w-0">
                        <Link
                          href={`/app/products/${p.id}`}
                          className="line-clamp-1 max-w-[260px] font-medium hover:underline"
                        >
                          {p.title}
                        </Link>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Badge variant="outline" className="px-1.5 py-0">
                            {p.marketplace}
                          </Badge>
                          {p.competitorsCount > 0 && (
                            <span>· {p.competitorsCount} конкур.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatPrice(p.lastPrice)}</TableCell>
                  <TableCell>{formatNumber(p.lastStock)}</TableCell>
                  <TableCell>{p.lastPosition ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={p.lastStatus} error={p.lastError} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {p.lastCheckedAt ? formatDate(p.lastCheckedAt) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Открыть на маркетплейсе"
                        asChild
                      >
                        <a href={p.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Обновить сейчас"
                        disabled={busy === p.id}
                        onClick={() => refresh(p.id)}
                      >
                        {busy === p.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Удалить"
                        disabled={busy === p.id}
                        onClick={() => remove(p.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function SortableHead({
  label,
  k,
  sortKey,
  toggleSort,
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  toggleSort: (k: SortKey) => void;
}) {
  return (
    <TableHead>
      <button
        className={cn(
          "flex items-center gap-1 hover:text-foreground",
          sortKey === k && "text-foreground",
        )}
        onClick={() => toggleSort(k)}
      >
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    </TableHead>
  );
}

function StatusBadge({
  status,
  error,
}: {
  status: ProductRow["lastStatus"];
  error: string | null;
}) {
  if (status === "OK") return <Badge variant="success">OK</Badge>;
  if (status === "FAILED")
    return (
      <Badge variant="destructive" title={error ?? undefined}>
        Ошибка
      </Badge>
    );
  return <Badge variant="secondary">Ожидает</Badge>;
}

function FilterChips({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <div className="flex gap-1 rounded-md border p-0.5">
      {options.map(([val, label]) => (
        <button
          key={val}
          onClick={() => onChange(val)}
          className={cn(
            "rounded px-2.5 py-1 text-xs font-medium transition-colors",
            value === val
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
