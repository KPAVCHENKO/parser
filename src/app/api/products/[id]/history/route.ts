import { handler, ok, authUser, ApiError } from "@/lib/api";
import {
  getProductHistory,
  type Metric,
  type Range,
} from "@/server/services/history-read";

const METRICS: Metric[] = ["price", "stock", "position"];
const RANGES: Range[] = ["7d", "30d", "90d"];

export const GET = handler(async (req, { params }) => {
  const user = await authUser();
  const url = new URL(req.url);
  const metric = (url.searchParams.get("metric") ?? "price") as Metric;
  const range = (url.searchParams.get("range") ?? "30d") as Range;

  if (!METRICS.includes(metric)) throw new ApiError("Неизвестная метрика", 422);
  if (!RANGES.includes(range)) throw new ApiError("Неизвестный диапазон", 422);

  const data = await getProductHistory(user.id, params.id, metric, range);
  return ok(data);
});
