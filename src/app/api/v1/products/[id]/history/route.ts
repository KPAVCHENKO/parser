import { handler, ok, ApiError } from "@/lib/api";
import { authByApiKey } from "@/lib/auth/api-key";
import {
  getProductHistory,
  type Metric,
  type Range,
} from "@/server/services/history-read";

const METRICS: Metric[] = ["price", "stock", "position"];
const RANGES: Range[] = ["7d", "30d", "90d"];

/** GET /api/v1/products/:id/history?metric=&range= (X-API-Key, тариф Pro). */
export const GET = handler(async (req, { params }) => {
  const user = await authByApiKey(req);
  const url = new URL(req.url);
  const metric = (url.searchParams.get("metric") ?? "price") as Metric;
  const range = (url.searchParams.get("range") ?? "30d") as Range;

  if (!METRICS.includes(metric)) throw new ApiError("Неизвестная метрика", 422);
  if (!RANGES.includes(range)) throw new ApiError("Неизвестный диапазон", 422);

  return ok(await getProductHistory(user.id, params.id, metric, range));
});
