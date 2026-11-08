"use client";

import { LocationPicker } from "@/components/location-picker";
import { useSettings } from "@/store/settings";

// يظهر محتوى الصفحة فقط بعد قراءة الإعدادات ووجود موقع، وإلا يعرض اختيار الموقع
export function LocationGate({ children, reason }: { children: React.ReactNode; reason: string }) {
  const hydrated = useSettings((s) => s.hydrated);
  const location = useSettings((s) => s.location);

  if (!hydrated) {
    return <div aria-busy className="mt-10 h-64 animate-pulse rounded-3xl bg-surface" />;
  }

  if (!location) {
    return (
      <section aria-labelledby="gate-title" className="mt-6 rounded-3xl border border-line bg-surface p-6 backdrop-blur-md">
        <h2 id="gate-title" className="font-naskh text-2xl font-bold">
          أين تصلّي؟
        </h2>
        <p className="mt-2 mb-5 text-muted">{reason}</p>
        <LocationPicker />
      </section>
    );
  }

  return <>{children}</>;
}
