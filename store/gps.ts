import { create } from "zustand";
import { useSettings } from "@/store/settings";

interface GpsStore {
  status: "idle" | "locating" | "error";
  error: string | null;
  locate: () => void;
}

// طلب الموقع مرة عند الحاجة، ويُحفظ الناتج في الإعدادات ليعمل التطبيق بعدها دون اتصال
export const useGps = create<GpsStore>()((set) => ({
  status: "idle",
  error: null,
  locate: () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      set({ status: "error", error: "المتصفح لا يدعم تحديد الموقع. اختر مدينتك من القائمة." });
      return;
    }
    set({ status: "locating", error: null });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        useSettings.getState().set({
          location: {
            mode: "gps",
            name: "موقعي الحالي",
            latitude: Number(pos.coords.latitude.toFixed(4)),
            longitude: Number(pos.coords.longitude.toFixed(4)),
          },
        });
        set({ status: "idle" });
      },
      (err) =>
        set({
          status: "error",
          error:
            err.code === err.PERMISSION_DENIED
              ? "رُفض إذن الموقع. اسمح به من إعدادات المتصفح أو اختر مدينتك."
              : "تعذّر تحديد الموقع. حاول مجددًا أو اختر مدينتك.",
        }),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 30 * 60 * 1000 }
    );
  },
}));
