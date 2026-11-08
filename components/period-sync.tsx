"use client";

import { useEffect } from "react";
import { useNow } from "@/hooks/useNow";
import { useTimes } from "@/hooks/useTimes";
import { periodAt, periodByClock } from "@/lib/prayer";
import { useSettings } from "@/store/settings";

const THEME_COLORS: Record<string, string> = {
  night: "#050818",
  fajr: "#141b44",
  morning: "#8fc0e3",
  dhuhr: "#4e97d1",
  asr: "#d99a4e",
  maghrib: "#24163c",
};

// يضبط فترة اليوم على <html> فتتغير ألوان الواجهة كلها مع السماء الحقيقية
export function PeriodSync() {
  const now = useNow(30_000);
  const hydrated = useSettings((s) => s.hydrated);
  const times = useTimes(now);
  const period = times ? periodAt(times.today, now) : periodByClock(now);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.dataset.period = period;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[period]);
  }, [period, hydrated]);

  return null;
}
