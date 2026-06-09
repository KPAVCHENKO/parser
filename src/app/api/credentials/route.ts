import { z } from "zod";
import { handler, parseBody, ok, created, authUser, ApiError } from "@/lib/api";
import {
  listCredentials,
  upsertCredential,
} from "@/server/services/credentials";
import { ozonAdapter } from "@/adapters/ozon";

export const GET = handler(async () => {
  const user = await authUser();
  return ok(await listCredentials(user.id));
});

const schema = z.discriminatedUnion("marketplace", [
  z.object({
    marketplace: z.literal("WB"),
    token: z.string().min(10, "Укажите токен WB"),
    label: z.string().max(80).optional(),
  }),
  z.object({
    marketplace: z.literal("OZON"),
    clientId: z.string().min(3, "Укажите Client-Id"),
    apiKey: z.string().min(10, "Укажите Api-Key"),
    label: z.string().max(80).optional(),
  }),
]);

export const POST = handler(async (req) => {
  const user = await authUser();
  const data = await parseBody(req, schema);

  // Для Ozon проверяем доступ перед сохранением
  if (data.marketplace === "OZON") {
    const valid = await ozonAdapter.validateCredentials({
      clientId: data.clientId,
      apiKey: data.apiKey,
    });
    if (!valid) {
      throw new ApiError("Ozon отклонил Client-Id/Api-Key. Проверьте данные.", 422);
    }
  }

  const cred = await upsertCredential(user.id, data.marketplace, data);
  return created({
    id: cred.id,
    marketplace: cred.marketplace,
    label: cred.label,
    isValid: cred.isValid,
  });
});
