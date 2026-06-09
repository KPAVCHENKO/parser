import type { Metadata } from "next";
import { Users, Package, CreditCard, TrendingUp } from "lucide-react";
import { getAdminStats, listUsersAdmin } from "@/server/services/admin";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Админка" };

export default async function AdminPage() {
  const [stats, users] = await Promise.all([
    getAdminStats(),
    listUsersAdmin(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Обзор</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<TrendingUp className="h-5 w-5 text-primary" />} title="MRR" value={formatPrice(stats.mrr)} />
        <Stat icon={<CreditCard className="h-5 w-5 text-primary" />} title="Платящих" value={String(stats.payingUsers)} />
        <Stat icon={<Users className="h-5 w-5 text-primary" />} title="Пользователей" value={String(stats.totalUsers)} />
        <Stat icon={<Package className="h-5 w-5 text-primary" />} title="Товаров" value={String(stats.totalProducts)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Распределение по тарифам</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-6 text-sm">
          <span>Free: <b>{stats.byPlan.FREE}</b></span>
          <span>Start: <b>{stats.byPlan.START}</b></span>
          <span>Pro: <b>{stats.byPlan.PRO}</b></span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Пользователи ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Имя</TableHead>
                  <TableHead>Тариф</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Товаров</TableHead>
                  <TableHead>Регистрация</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.email}
                      {u.role === "ADMIN" && (
                        <Badge variant="secondary" className="ml-2">admin</Badge>
                      )}
                    </TableCell>
                    <TableCell>{u.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={u.plan === "FREE" ? "outline" : "default"}>
                        {u.plan}
                      </Badge>
                    </TableCell>
                    <TableCell>{u.status}</TableCell>
                    <TableCell>{u.products}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(u.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
