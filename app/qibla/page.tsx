"use client";

import { useEffect, useRef } from "react";
import { Compass } from "lucide-react";
import { LocationGate } from "@/components/location-gate";
import { QiblaCompass } from "@/components/qibla-compass";
import { useCompassHeading, type CompassStatus } from "@/hooks/useCompassHeading";
import { num } from "@/lib/format";
import { angleDelta, directionName, distanceToKaabaKm, qiblaBearing } from "@/lib/qibla";
import { useSettings } from "@/store/settings";

// حساسات الجوال تخطئ بضع درجات عادةً
const TOLERANCE = 5;

export default function QiblaPage() {
  return (
    <>
      <header>
        <h1 className="font-naskh text-3xl font-bold">القبلة</h1>
      </header>
      <LocationGate reason="نحتاج موقعك لنحسب اتجاه الكعبة منه.">
        <QiblaContent />
      </LocationGate>
    </>
  );
}

function QiblaContent() {
  const location = useSettings((s) => s.location);
  const { heading, status, requestPermission } = useCompassHeading();
  const bearing = location ? qiblaBearing(location) : 0;
  const live = status === "active" && heading !== null;
  const delta = live ? angleDelta(heading, bearing) : null;
  const aligned = delta !== null && Math.abs(delta) <= TOLERANCE;

  // اهتزاز واحد عند الوصول للاتجاه، لا مع كل قراءة
  const wasAligned = useRef(false);
  useEffect(() => {
    if (aligned && !wasAligned.current && "vibrate" in navigator) navigator.vibrate(70);
    wasAligned.current = aligned;
  }, [aligned]);

  if (!location) return null;

  return (
    <div className="mt-6 flex flex-col items-center gap-6 text-center">
      <QiblaCompass bearing={bearing} heading={live ? heading : null} aligned={aligned} />

      <div>
        <p className="text-5xl font-semibold tabular-nums">{num(bearing)}°</p>
        <p className="mt-1 text-muted">من الشمال باتجاه {directionName(bearing)}</p>
      </div>

      <p
        aria-live="polite"
        className={`min-h-12 rounded-full px-6 py-3 text-lg font-semibold transition-colors duration-200 ${
          aligned ? "bg-accent text-accent-ink" : ""
        }`}
      >
        {delta === null
          ? ""
          : aligned
            ? "أنت تواجه القبلة"
            : `استدر ${delta > 0 ? "يمينًا" : "يسارًا"} ${num(Math.abs(delta))}°`}
      </p>

      <StatusNote status={status} onEnable={requestPermission} bearing={bearing} />

      <p className="text-sm text-muted">
        {location.name} · تبعد الكعبة {num(distanceToKaabaKm(location))} كم
      </p>
    </div>
  );
}

function StatusNote({ status, onEnable, bearing }: { status: CompassStatus; onEnable: () => void; bearing: number }) {
  if (status === "needs-permission") {
    return (
      <button
        type="button"
        onClick={onEnable}
        className="flex min-h-12 items-center gap-2 rounded-full bg-accent px-6 py-3 font-semibold text-accent-ink"
      >
        <Compass aria-hidden className="size-5" />
        تفعيل البوصلة
      </button>
    );
  }
  const text = {
    active: "ضع الهاتف مستويًا بعيدًا عن المعادن. إن بدا الاتجاه غير دقيق فحرّك الهاتف على شكل الرقم ٨.",
    denied: "لم يُسمح بالوصول إلى البوصلة. فعّل «الحركة والاتجاه» من إعدادات سفاري ثم أعد فتح الصفحة.",
    unsupported: `لا توجد بوصلة في هذا الجهاز. الشمال أعلى القرص، والقبلة على ${num(bearing)}° منه مع عقارب الساعة.`,
    starting: "جارٍ تشغيل البوصلة…",
  }[status];
  return <p className="max-w-sm rounded-3xl border border-line bg-surface px-5 py-4 text-sm leading-relaxed">{text}</p>;
}
