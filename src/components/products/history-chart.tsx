"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type Metric = "price" | "stock" | "position";
type Range = "7d" | "30d" | "90d";

interface HistoryResponse {
  metric: Metric;
  range: Range;
  series: Array<{ key: string; name: string }>;
  data: Array<Record<string, number | string | null>>;
}

const COLORS = ["#4f46e5", "#16a34a", "#ea580c", "#db2777", "#0891b2", "#ca8a04"];

const METRIC_LABEL: Record<Metric, string> = {
  price: "Цена",
  stock: "Остаток",
  position: "Позиция",
};

export function HistoryChart({ productId }: { productId: string }) {
  const [metric, setMetric] = React.useState<Metric>("price");
  const [range, setRange] = React.useState<Range>("30d");
  const [res, setRes] = React.useState<HistoryResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/products/${productId}/history?metric=${metric}&range=${range}`)
      .then((r) => r.json())
      .then((json) => {
        if (active) setRes(json.data ?? null);
      })
      .catch(() => active && setRes(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [productId, metric, range]);

  const hasData = res && res.data.length > 0;

  function fmtX(t: string): string {
    const d = new Date(t);
    return range === "7d"
      ? d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit" })
      : d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs value={metric} onValueChange={(v) => setMetric(v as Metric)}>
          <TabsList>
            <TabsTrigger value="price">Цена</TabsTrigger>
            <TabsTrigger value="stock">Остаток</TabsTrigger>
            <TabsTrigger value="position">Позиция</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-1 rounded-md border p-0.5">
          {(["7d", "30d", "90d"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                range === r
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r === "7d" ? "7 дней" : r === "30d" ? "30 дней" : "90 дней"}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !hasData ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
            История ещё собирается. Графики {METRIC_LABEL[metric].toLowerCase()}{" "}
            появятся после нескольких обновлений по расписанию тарифа.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={res!.data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="t"
                tickFormatter={fmtX}
                tick={{ fontSize: 11 }}
                minTickGap={24}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                reversed={metric === "position"}
                width={48}
                allowDecimals={false}
              />
              <Tooltip
                labelFormatter={(t) => fmtX(String(t))}
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {res!.series.map((s, i) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={i === 0 ? 2.5 : 1.5}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
