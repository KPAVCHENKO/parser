import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { env } from "@/lib/env";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(env.appUrl),
  title: {
    default: "MarketPulse — мониторинг цен и остатков на Wildberries и Ozon",
    template: "%s · MarketPulse",
  },
  description:
    "Отслеживайте цены конкурентов, остатки и позиции товаров на Wildberries и Ozon. Графики динамики, уведомления в Telegram, выгрузка в Excel.",
  keywords: [
    "мониторинг цен Wildberries",
    "отслеживание остатков Ozon",
    "аналитика маркетплейсов",
    "цены конкурентов WB",
    "позиции в поиске Ozon",
  ],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "MarketPulse",
    title: "MarketPulse — мониторинг цен и остатков на WB и Ozon",
    description:
      "Цены конкурентов, остатки и позиции в выдаче. Уведомления, графики, экспорт.",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
