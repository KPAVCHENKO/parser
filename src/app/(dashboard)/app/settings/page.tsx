import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getPlan } from "@/lib/plans";
import { listCredentials } from "@/server/services/credentials";
import {
  CredentialsForm,
  type CredentialMeta,
} from "@/components/settings/credentials-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Настройки" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const plan = getPlan(user.subscription?.plan ?? "FREE");
  const creds = (await listCredentials(user.id)) as CredentialMeta[];
  const appUrl = process.env.APP_URL ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Настройки</h1>
        <p className="text-sm text-muted-foreground">
          Токены маркетплейсов, реферальная программа и API.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Токены маркетплейсов</h2>
        <CredentialsForm credentials={creds} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Реферальная программа</CardTitle>
          <CardDescription>
            Делитесь ссылкой — за каждого друга вы оба получаете 30 бонусных дней.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            Ваш код:{" "}
            <span className="rounded bg-muted px-2 py-1 font-mono">
              {user.referralCode}
            </span>
          </div>
          <div className="break-all text-muted-foreground">
            Ссылка: {appUrl}/register?ref={user.referralCode}
          </div>
        </CardContent>
      </Card>

      {plan.features.apiAccess && (
        <Card>
          <CardHeader>
            <CardTitle>API-доступ (Pro)</CardTitle>
            <CardDescription>
              Используйте ключ в заголовке <code>X-API-Key</code> для запросов к{" "}
              <code>/api/v1</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="break-all rounded bg-muted px-2 py-1 font-mono text-sm">
              {user.apiKey}
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
