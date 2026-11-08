"use client";

import { useState } from "react";
import { LocateFixed, Loader2 } from "lucide-react";
import { CITIES } from "@/lib/cities";
import { useGps } from "@/store/gps";
import { useSettings } from "@/store/settings";

export const fieldClass =
  "w-full rounded-2xl border border-line bg-surface px-4 py-3 text-base text-fg outline-none focus-visible:border-accent";

// اختيار الموقع: GPS أو مدينة من القائمة أو إحداثيات يدوية
export function LocationPicker() {
  const location = useSettings((s) => s.location);
  const set = useSettings((s) => s.set);
  const { status, error, locate } = useGps();
  const [lat, setLat] = useState(location?.mode === "custom" ? String(location.latitude) : "");
  const [lng, setLng] = useState(location?.mode === "custom" ? String(location.longitude) : "");
  const [customError, setCustomError] = useState<string | null>(null);

  const cityValue = location?.mode === "city" ? location.name : "";

  const saveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const la = Number(lat);
    const lo = Number(lng);
    if (!Number.isFinite(la) || !Number.isFinite(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180 || !lat || !lng) {
      setCustomError("أدخل خط عرض بين -90 و 90 وخط طول بين -180 و 180.");
      return;
    }
    setCustomError(null);
    set({ location: { mode: "custom", name: "إحداثيات مخصّصة", latitude: la, longitude: lo } });
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={locate}
        disabled={status === "locating"}
        className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 font-semibold text-accent-ink disabled:opacity-70"
      >
        {status === "locating" ? (
          <Loader2 aria-hidden className="size-5 animate-spin" />
        ) : (
          <LocateFixed aria-hidden className="size-5" />
        )}
        {status === "locating" ? "جارٍ تحديد موقعك…" : "استخدم موقعي الحالي"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-muted">
          {error}
        </p>
      )}

      <label className="flex flex-col gap-2 text-sm text-muted">
        أو اختر مدينة
        <select
          className={fieldClass}
          value={cityValue}
          onChange={(e) => {
            const city = CITIES.find((c) => c.name === e.target.value);
            if (city) set({ location: { mode: "city", name: city.name, latitude: city.latitude, longitude: city.longitude } });
          }}
        >
          <option value="" disabled>
            اختر من القائمة
          </option>
          {CITIES.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name} — {c.country}
            </option>
          ))}
        </select>
      </label>

      <details className="rounded-2xl border border-line px-4 py-3">
        <summary className="text-sm text-muted">إدخال الإحداثيات يدويًا</summary>
        <form onSubmit={saveCustom} className="mt-3 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs text-muted">
            خط العرض
            <input dir="ltr" inputMode="decimal" className={fieldClass} value={lat} onChange={(e) => setLat(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            خط الطول
            <input dir="ltr" inputMode="decimal" className={fieldClass} value={lng} onChange={(e) => setLng(e.target.value)} />
          </label>
          {customError && (
            <p role="alert" className="col-span-2 text-sm text-muted">
              {customError}
            </p>
          )}
          <button type="submit" className="col-span-2 rounded-2xl border border-line px-4 py-3 font-medium hover:bg-surface">
            حفظ الإحداثيات
          </button>
        </form>
      </details>
    </div>
  );
}
