import Link from "next/link";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { env } from "@/lib/env";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const legalName = env.legal.entityName || "MarketPulse";
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Activity className="h-5 w-5 text-primary" />
            MarketPulse
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="/#features" className="text-muted-foreground hover:text-foreground">
              Возможности
            </a>
            <a href="/#pricing" className="text-muted-foreground hover:text-foreground">
              Тарифы
            </a>
            <a href="/#faq" className="text-muted-foreground hover:text-foreground">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link href="/login">Вход</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Начать</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t">
        <div className="container flex flex-col gap-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span>© {year} {legalName}</span>
          </div>
          <nav className="flex flex-wrap gap-4">
            <Link href="/offer" className="hover:text-foreground">
              Публичная оферта
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Политика конфиденциальности
            </Link>
            <a href="/#pricing" className="hover:text-foreground">
              Тарифы
            </a>
            <Link href="/login" className="hover:text-foreground">
              Вход
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
