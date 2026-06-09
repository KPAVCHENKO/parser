import { handler, authUser } from "@/lib/api";
import { assertFeature } from "@/server/guards";
import { getExportData } from "@/server/services/export";
import { buildPriceHistoryCsv } from "@/lib/export/csv";

export const GET = handler(async () => {
  const user = await authUser();
  assertFeature(user, "export");

  const data = await getExportData(user.id);
  const csv = buildPriceHistoryCsv(data);
  const filename = `marketpulse-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
