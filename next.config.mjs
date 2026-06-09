/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.wbbasket.ru" },
      { protocol: "https", hostname: "**.wb.ru" },
      { protocol: "https", hostname: "basket-**.wbbasket.ru" },
      { protocol: "https", hostname: "**.ozon.ru" },
      { protocol: "https", hostname: "**.ozonusercontent.com" },
      { protocol: "https", hostname: "ir.ozone.ru" },
      { protocol: "https", hostname: "cdn**.ozone.ru" },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["bullmq", "ioredis", "exceljs", "bcryptjs"],
  },
};

export default nextConfig;
