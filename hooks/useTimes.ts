"use client";

import { useMemo } from "react";
import { addDays, computeDay, type CalcOptions, type DayTimes } from "@/lib/prayer";
import { todayKey } from "@/lib/format";
import { useSettings } from "@/store/settings";

export function useCalcOptions(): CalcOptions {
  const method = useSettings((s) => s.method);
  const madhab = useSettings((s) => s.madhab);
  const offsets = useSettings((s) => s.offsets);
  return useMemo(() => ({ method, madhab, offsets }), [method, madhab, offsets]);
}

// مواقيت اليوم والغد، تُعاد حسابها فقط عند تغيّر اليوم أو الإعدادات
export function useTimes(now: Date): { today: DayTimes; tomorrow: DayTimes } | null {
  const location = useSettings((s) => s.location);
  const opts = useCalcOptions();
  const day = todayKey(now);

  return useMemo(() => {
    if (!location) return null;
    const base = new Date();
    return {
      today: computeDay(location, base, opts),
      tomorrow: computeDay(location, addDays(base, 1), opts),
    };
    // day يكفي لإعادة الحساب عند منتصف الليل
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, opts, day]);
}
