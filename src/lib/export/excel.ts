import ExcelJS from "exceljs";
import type { ExportData } from "@/server/services/export";

/** Формирует .xlsx с листами «Товары» и «История цен». */
export async function buildHistoryWorkbook(data: ExportData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "MarketPulse";
  wb.created = new Date();

  const products = wb.addWorksheet("Товары");
  products.columns = [
    { header: "Маркетплейс", key: "marketplace", width: 14 },
    { header: "Название", key: "title", width: 48 },
    { header: "Артикул", key: "externalId", width: 14 },
    { header: "Цена, ₽", key: "price", width: 12 },
    { header: "Остаток", key: "stock", width: 10 },
    { header: "Позиция", key: "position", width: 10 },
    { header: "Рейтинг", key: "rating", width: 10 },
    { header: "Обновлён", key: "updatedAt", width: 22 },
    { header: "Ссылка", key: "url", width: 50 },
  ];
  products.getRow(1).font = { bold: true };
  for (const p of data.products) products.addRow(p);

  const history = wb.addWorksheet("История цен");
  history.columns = [
    { header: "Маркетплейс", key: "marketplace", width: 14 },
    { header: "Товар", key: "product", width: 40 },
    { header: "Субъект", key: "subject", width: 30 },
    { header: "Цена, ₽", key: "price", width: 12 },
    { header: "Старая цена, ₽", key: "oldPrice", width: 14 },
    { header: "Дата", key: "recordedAt", width: 22 },
  ];
  history.getRow(1).font = { bold: true };
  for (const r of data.priceHistory) history.addRow(r);

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
