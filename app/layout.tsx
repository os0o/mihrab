import type { Metadata, Viewport } from "next";
import { Amiri, Amiri_Quran, IBM_Plex_Sans_Arabic } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});

// خط مخصّص لنص المصحف بعلامات الضبط العثمانية
const amiriQuran = Amiri_Quran({
  subsets: ["arabic"],
  weight: "400",
  variable: "--font-amiri-quran",
  display: "swap",
});

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "مِحراب",
  description: "مواقيت الصلاة والأذان، اتجاه القبلة، الأذكار والسبحة، ورمضان — يعمل دون اتصال.",
  manifest: `${BASE}/manifest.json`,
  applicationName: "مِحراب",
  appleWebApp: { capable: true, title: "مِحراب", statusBarStyle: "black-translucent" },
  icons: {
    icon: `${BASE}/icons/icon.svg`,
    apple: `${BASE}/icons/icon-192.png`,
  },
};

export const viewport: Viewport = {
  themeColor: "#050818",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" data-period="night" className={`${plex.variable} ${amiri.variable} ${amiriQuran.variable}`}>
      <body className="min-h-dvh antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
