import {
  CalculationMethod,
  Coordinates,
  HighLatitudeRule,
  Madhab,
  PrayerTimes,
  type CalculationParameters,
} from "adhan";
import { hijriParts } from "@/lib/hijri";

export interface Coords {
  latitude: number;
  longitude: number;
}

export const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
export type Prayer = (typeof PRAYERS)[number];

// الشروق ليس صلاة لكنه يظهر في الجدول وعلى قوس الشمس
export const TIMELINE = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"] as const;
export type TimelineKey = (typeof TIMELINE)[number];

export const LABELS: Record<TimelineKey, string> = {
  fajr: "الفجر",
  sunrise: "الشروق",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};

export const METHODS = {
  UmmAlQura: "أم القرى، مكة المكرمة",
  Egyptian: "الهيئة المصرية العامة للمساحة",
  MuslimWorldLeague: "رابطة العالم الإسلامي",
  Dubai: "دبي",
  Kuwait: "الكويت",
  Qatar: "قطر",
  Karachi: "جامعة العلوم الإسلامية، كراتشي",
  Turkey: "رئاسة الشؤون الدينية، تركيا",
  NorthAmerica: "الجمعية الإسلامية لأمريكا الشمالية",
  MoonsightingCommittee: "لجنة رؤية الهلال",
  Singapore: "سنغافورة",
  Tehran: "معهد الجيوفيزياء، طهران",
} as const;
export type MethodKey = keyof typeof METHODS;

export type MadhabKey = "shafi" | "hanafi";

export interface CalcOptions {
  method: MethodKey;
  madhab: MadhabKey;
  // تعديل يدوي بالدقائق لكل وقت، لمطابقة تقويم المسجد المحلي
  offsets: Record<TimelineKey, number>;
}

export type DayTimes = Record<TimelineKey, Date>;

function params(opts: CalcOptions, coords: Coordinates): CalculationParameters {
  const p = CalculationMethod[opts.method]();
  p.madhab = opts.madhab === "hanafi" ? Madhab.Hanafi : Madhab.Shafi;
  // يمنع أوقاتًا مستحيلة للفجر والعشاء في خطوط العرض العالية صيفًا
  p.highLatitudeRule = HighLatitudeRule.recommended(coords);
  return p;
}

const MIN = 60_000;

export function computeDay(coords: Coords, date: Date, opts: CalcOptions): DayTimes {
  const c = new Coordinates(coords.latitude, coords.longitude);
  const t = new PrayerTimes(c, date, params(opts, c));
  const day: DayTimes = {
    fajr: t.fajr,
    sunrise: t.sunrise,
    dhuhr: t.dhuhr,
    asr: t.asr,
    maghrib: t.maghrib,
    isha: t.isha,
  };
  // تقويم أم القرى يؤخّر العشاء إلى ساعتين بعد المغرب في رمضان
  if (opts.method === "UmmAlQura" && hijriParts(date).month === 9) {
    day.isha = new Date(day.maghrib.getTime() + 120 * MIN);
  }
  for (const key of TIMELINE) {
    if (opts.offsets[key]) day[key] = new Date(day[key].getTime() + opts.offsets[key] * MIN);
  }
  return day;
}

export function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export interface Upcoming {
  key: Prayer;
  at: Date;
  // بداية الفترة الحالية، لحساب نسبة التقدم
  from: Date;
}

// الصلاة القادمة (بعد العشاء تكون فجر الغد)
export function nextPrayer(today: DayTimes, tomorrow: DayTimes, now: Date): Upcoming {
  const list = PRAYERS.map((key) => ({ key, at: today[key] }));
  const idx = list.findIndex((p) => p.at > now);
  if (idx === -1) return { key: "fajr", at: tomorrow.fajr, from: today.isha };
  const prev = idx === 0 ? null : list[idx - 1];
  // قبل الفجر: الفترة بدأت من عشاء البارحة تقريبًا (نستخدم منتصف الليل كبداية معقولة)
  const from = prev ? prev.at : new Date(new Date(now).setHours(0, 0, 0, 0));
  return { key: list[idx].key, at: list[idx].at, from };
}

// فترات اليوم التي يتلون بها السماء والواجهة
export type Period = "night" | "fajr" | "morning" | "dhuhr" | "asr" | "maghrib";

export function periodAt(day: DayTimes, now: Date): Period {
  if (now < day.fajr) return "night";
  if (now < day.sunrise) return "fajr";
  if (now < day.dhuhr) return "morning";
  if (now < day.asr) return "dhuhr";
  if (now < day.maghrib) return "asr";
  if (now < day.isha) return "maghrib";
  return "night";
}

// تقدير بالساعة عند عدم توفر الموقع بعد
export function periodByClock(now: Date): Period {
  const h = now.getHours();
  if (h < 4) return "night";
  if (h < 6) return "fajr";
  if (h < 12) return "morning";
  if (h < 15) return "dhuhr";
  if (h < 18) return "asr";
  if (h < 19) return "maghrib";
  return "night";
}
