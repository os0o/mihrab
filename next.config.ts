import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: false,
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    runtimeCaching: [
      {
        // نص المصحف لا يتغير، فنقرأ من التخزين أولًا
        urlPattern: /^https:\/\/api\.alquran\.cloud\/v1\/page\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "quran-pages",
          expiration: { maxEntries: 700, maxAgeSeconds: 60 * 60 * 24 * 365 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
});

// تصدير ثابت كامل: المواقيت تُحسب على الجهاز فلا حاجة لخادم
const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  images: { unoptimized: true },
};

export default withPWA(nextConfig);
