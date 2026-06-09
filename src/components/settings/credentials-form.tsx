"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface CredentialMeta {
  id: string;
  marketplace: "WB" | "OZON";
  label: string | null;
  isValid: boolean;
}

export function CredentialsForm({
  credentials,
}: {
  credentials: CredentialMeta[];
}) {
  const wb = credentials.find((c) => c.marketplace === "WB");
  const ozon = credentials.find((c) => c.marketplace === "OZON");

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Wildberries {wb && <Connected />}
          </CardTitle>
          <CardDescription>
            Токен статистики WB (необязательно) — точные остатки и продажи ваших
            товаров. Публичные карточки работают и без него.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WbForm connected={!!wb} credId={wb?.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Ozon {ozon && <Connected />}
          </CardTitle>
          <CardDescription>
            Client-Id и Api-Key из личного кабинета Ozon Seller (раздел
            «Настройки → API-ключи»). Обязательны для данных Ozon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OzonForm connected={!!ozon} credId={ozon?.id} />
        </CardContent>
      </Card>
    </div>
  );
}

function Connected() {
  return (
    <Badge variant="success" className="gap-1">
      <CheckCircle2 className="h-3 w-3" /> подключено
    </Badge>
  );
}

function useCredActions() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function save(body: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error || "Ошибка сохранения");
      else router.refresh();
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    setLoading(true);
    try {
      await fetch(`/api/credentials/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, save, remove };
}

function WbForm({ connected, credId }: { connected: boolean; credId?: string }) {
  const { loading, error, save, remove } = useCredActions();
  const [token, setToken] = React.useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        save({ marketplace: "WB", token });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="wb-token">Токен статистики</Label>
        <Input
          id="wb-token"
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder={connected ? "•••••• (сохранён)" : "вставьте токен"}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading || token.length < 10}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Сохранить
        </Button>
        {connected && credId && (
          <Button
            type="button"
            variant="outline"
            onClick={() => remove(credId)}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4" /> Удалить
          </Button>
        )}
      </div>
    </form>
  );
}

function OzonForm({ connected, credId }: { connected: boolean; credId?: string }) {
  const { loading, error, save, remove } = useCredActions();
  const [clientId, setClientId] = React.useState("");
  const [apiKey, setApiKey] = React.useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        save({ marketplace: "OZON", clientId, apiKey });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="ozon-client">Client-Id</Label>
        <Input
          id="ozon-client"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder="123456"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ozon-key">Api-Key</Label>
        <Input
          id="ozon-key"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={connected ? "•••••• (сохранён)" : "вставьте ключ"}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={loading || clientId.length < 3 || apiKey.length < 10}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Сохранить
        </Button>
        {connected && credId && (
          <Button
            type="button"
            variant="outline"
            onClick={() => remove(credId)}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4" /> Удалить
          </Button>
        )}
      </div>
    </form>
  );
}
