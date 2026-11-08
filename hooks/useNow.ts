"use client";

import { useEffect, useState } from "react";

// ساعة حية تتحدث كل intervalMs، ومتزامنة مع بداية الثانية كي لا يتأخر العدّاد
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer: number;
    const tick = () => {
      setNow(new Date());
      timer = window.setTimeout(tick, intervalMs - (Date.now() % intervalMs));
    };
    timer = window.setTimeout(tick, intervalMs - (Date.now() % intervalMs));
    // عند العودة للتبويب بعد فترة نحدّث فورًا بدل انتظار الدورة التالية
    const onVisible = () => document.visibilityState === "visible" && setNow(new Date());
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);
  return now;
}
