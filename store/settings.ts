import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MadhabKey, MethodKey, Prayer, TimelineKey } from "@/lib/prayer";

export interface SavedLocation {
  mode: "gps" | "city" | "custom";
  name: string;
  latitude: number;
  longitude: number;
}

export interface PrayerAlert {
  enabled: boolean;
  // تنبيه قبل الأذان بالدقائق، 0 = بدون
  before: number;
}

export interface Settings {
  location: SavedLocation | null;
  method: MethodKey;
  madhab: MadhabKey;
  offsets: Record<TimelineKey, number>;
  hour12: boolean;
  alerts: Record<Prayer, PrayerAlert>;
  // صوت الأذان: "default" للملف المرفق، أو معرّف صوت رفعه المستخدم، أو "tone" لنغمة قصيرة
  voice: string;
  fajrVoice: string;
  volume: number;
  // منبّه الفجر قبل الوقت بالدقائق (0 = معطّل)
  fajrAlarm: number;
  ramadan: { suhoorBefore: number; iftar: boolean };
}

interface SettingsStore extends Settings {
  hydrated: boolean;
  set: (patch: Partial<Settings>) => void;
  setAlert: (prayer: Prayer, patch: Partial<PrayerAlert>) => void;
  setOffset: (key: TimelineKey, minutes: number) => void;
  reset: () => void;
}

const alert = (enabled = true): PrayerAlert => ({ enabled, before: 0 });

export const DEFAULT_SETTINGS: Settings = {
  location: null,
  method: "UmmAlQura",
  madhab: "shafi",
  offsets: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
  hour12: true,
  alerts: { fajr: alert(), dhuhr: alert(), asr: alert(), maghrib: alert(), isha: alert() },
  voice: "default",
  fajrVoice: "default",
  volume: 0.9,
  fajrAlarm: 0,
  ramadan: { suhoorBefore: 45, iftar: true },
};

// skipHydration: الصفحات مولّدة مسبقًا، فنقرأ التخزين بعد التركيب لتجنب اختلاف HTML
export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      hydrated: false,
      set: (patch) => set(patch),
      setAlert: (prayer, patch) => set((s) => ({ alerts: { ...s.alerts, [prayer]: { ...s.alerts[prayer], ...patch } } })),
      setOffset: (key, minutes) => set((s) => ({ offsets: { ...s.offsets, [key]: minutes } })),
      reset: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: "mihrab-settings",
      version: 1,
      skipHydration: true,
      // نحفظ حقول الإعدادات فقط، لا الدوال ولا علم القراءة
      partialize: (s) =>
        Object.fromEntries(Object.keys(DEFAULT_SETTINGS).map((k) => [k, s[k as keyof Settings]])) as unknown as Settings,
      onRehydrateStorage: () => () => useSettings.setState({ hydrated: true }),
    }
  )
);
