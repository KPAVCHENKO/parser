import type { ExportData } from "@/server/services/export";

function escapeCsv(value: string | number | null): string {
  if (value === null) return "";
  const s = String(value);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** История цен в CSV (разделитель ; — дружелюбно к Excel в ru-локали). */
export function buildPriceHistoryCsv(data: ExportData): string {
  const header = [
    "Маркетплейс",
    "Товар",
    "Субъект",
    "Цена",
    "Старая цена",
    "Дата",
  ].join(";");

  const rows = data.priceHistory.map((r) =>
    [
      r.marketplace,
      r.product,
      r.subject,
      r.price,
      r.oldPrice,
      r.recordedAt,
    ]
      .map(escapeCsv)
      .join(";"),
  );

  // BOM, чтобы Excel корректно открыл UTF-8 с кириллицей
  return "﻿" + [header, ...rows].join("\r\n");
}
