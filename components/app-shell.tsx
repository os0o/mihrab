"use client";

import { useEffect } from "react";
import { AlertEngine } from "@/components/alert-engine";
import { PeriodSync } from "@/components/period-sync";
import { TabBar } from "@/components/tab-bar";
import { Toasts } from "@/components/toasts";
import { useProgress } from "@/store/progress";
import { useQuran } from "@/store/quran";
import { useSettings } from "@/store/settings";

export function AppShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void useSettings.persist.rehydrate();
    void useProgress.persist.rehydrate();
    void useQuran.persist.rehydrate();
  }, []);

  return (
    <>
      {/* السماء ثابتة خلف أعلى الصفحة وتتلوّن مع وقت الصلاة */}
      <div aria-hidden className="sky pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem]">
        <div className="stars absolute inset-0" />
      </div>
      <PeriodSync />
      <AlertEngine />
      <main className="mx-auto w-full max-w-xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-32">{children}</main>
      <Toasts />
      <TabBar />
    </>
  );
}
