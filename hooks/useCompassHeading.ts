"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeDeg } from "@/lib/qibla";

// "needs-permission": سفاري iOS يشترط ضغطة من المستخدم قبل قراءة البوصلة
export type CompassStatus = "starting" | "needs-permission" | "active" | "unsupported" | "denied";

interface IOSOrientationEvent extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

interface OrientationEventCtor {
  requestPermission?: () => Promise<"granted" | "denied">;
}

const NO_DATA_TIMEOUT = 2500;

// اتجاه الهاتف من الشمال (0-360) عبر حساس الاتجاه، أو null إن لم يتوفر
export function useCompassHeading() {
  const [heading, setHeading] = useState<number | null>(null);
  const [status, setStatus] = useState<CompassStatus>("starting");
  const [listening, setListening] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
      setStatus("unsupported");
      return;
    }
    const ctor = window.DeviceOrientationEvent as unknown as OrientationEventCtor;
    if (typeof ctor.requestPermission === "function") setStatus("needs-permission");
    else setListening(true);
  }, []);

  useEffect(() => {
    if (!listening) return;

    // كروم أندرويد يرسل الاتجاه المطلق في حدث منفصل؛ الحدث العادي فيه نسبي للوضع الابتدائي
    const absoluteEvent = "ondeviceorientationabsolute" in window;
    const eventName = absoluteEvent ? "deviceorientationabsolute" : "deviceorientation";
    let received = false;

    const onOrientation = (e: Event) => {
      const ev = e as IOSOrientationEvent;
      let value: number | null = null;
      if (typeof ev.webkitCompassHeading === "number") {
        value = ev.webkitCompassHeading; // iOS: جاهز من الشمال ومع عقارب الساعة
      } else if (ev.alpha !== null && (absoluteEvent || ev.absolute)) {
        // alpha يزيد عكس عقارب الساعة، ونعوّض دوران الشاشة الأفقي
        const screenAngle = window.screen.orientation?.angle ?? 0;
        value = 360 - ev.alpha + screenAngle;
      }
      if (value === null) return;
      received = true;
      setHeading(normalizeDeg(value));
      setStatus("active");
    };

    window.addEventListener(eventName, onOrientation);
    // الحاسوب يرسل الحدث بقيم فارغة أو لا يرسله أصلًا، فنعتبره غير مدعوم بعد مهلة قصيرة
    const timer = window.setTimeout(() => {
      if (!received) setStatus("unsupported");
    }, NO_DATA_TIMEOUT);

    return () => {
      window.removeEventListener(eventName, onOrientation);
      window.clearTimeout(timer);
    };
  }, [listening]);

  const requestPermission = useCallback(async () => {
    const ctor = window.DeviceOrientationEvent as unknown as OrientationEventCtor;
    try {
      const result = await ctor.requestPermission?.();
      if (result === "granted") {
        setStatus("starting");
        setListening(true);
      } else {
        setStatus("denied");
      }
    } catch {
      setStatus("denied");
    }
  }, []);

  return { heading, status, requestPermission };
}
