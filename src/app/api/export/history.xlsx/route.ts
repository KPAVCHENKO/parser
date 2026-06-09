import { handler, authUser } from "@/lib/api";
import { assertFeature } from "@/server/guards";
import { getExportData } from "@/server/services/export";
import { buildHistoryWorkbook } from "@/lib/export/excel";

export const GET = handler(async () => {
  const user = await authUser();
  assertFeature(user, "export");

  const data = await getExportData(user.id);
  const buffer = await buildHistoryWorkbook(data);
  const filename = `marketpulse-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
