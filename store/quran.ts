import { create } from "zustand";
import { persist } from "zustand/middleware";
import { todayKey } from "@/lib/format";
import { TOTAL_PAGES, clampPage, pagesPerDay, wirdAt } from "@/lib/quran";

interface QuranStore {
  hydrated: boolean;
  // مدة الختمة بالأيام، ومنها يُحسب عدد صفحات الورد اليومي
  days: number;
  // أول صفحة لم تُقرأ بعد في الختمة الحالية
  nextPage: number;
  startedAt: string;
  khatmas: number;
  // عدد الصفحات المقروءة في كل يوم (لسلسلة الأيام والخريطة)
  log: Record<string, number>;
  // بداية ورد اليوم تُثبَّت عند أول قراءة فيه كي لا يتحرك النطاق أثناء القراءة
  today: { date: string; from: number } | null;
  bookmark: number | null;
  // وقت تذكير الورد "HH:mm"، أو "" للتعطيل
  reminder: string;
  setDays: (days: number) => void;
  setReminder: (hhmm: string) => void;
  setBookmark: (page: number) => void;
  // يسجّل القراءة حتى صفحة معيّنة؛ يعيد true عند إتمام الختمة
  readUntil: (page: number) => boolean;
  restart: (page?: number) => void;
}

export const useQuran = create<QuranStore>()(
  persist(
    (set, get) => ({
      hydrated: false,
      days: 30,
      nextPage: 1,
      startedAt: todayKey(),
      khatmas: 0,
      log: {},
      today: null,
      bookmark: null,
      reminder: "",
      setDays: (days) => set({ days }),
      setReminder: (reminder) => set({ reminder }),
      setBookmark: (page) => set({ bookmark: clampPage(page) }),
      readUntil: (page) => {
        const s = get();
        const key = todayKey();
        const to = clampPage(page);
        const count = to - s.nextPage + 1;
        if (count <= 0) return false;
        const from = s.today?.date === key ? s.today.from : s.nextPage;
        const log = { ...s.log, [key]: (s.log[key] ?? 0) + count };
        if (to >= TOTAL_PAGES) {
          set({ log, nextPage: 1, khatmas: s.khatmas + 1, startedAt: key, today: { date: key, from }, bookmark: null });
          return true;
        }
        set({ log, nextPage: to + 1, today: { date: key, from }, bookmark: to + 1 });
        return false;
      },
      restart: (page = 1) => set({ nextPage: clampPage(page), startedAt: todayKey(), today: null, bookmark: null }),
    }),
    {
      name: "mihrab-quran",
      skipHydration: true,
      partialize: ({ hydrated: _hydrated, ...rest }) => rest, // eslint-disable-line @typescript-eslint/no-unused-vars
      onRehydrateStorage: () => () => useQuran.setState({ hydrated: true }),
    }
  )
);

const DAY = 86_400_000;

function daysBetween(fromKey: string, to: Date) {
  const [y, m, d] = fromKey.split("-").map(Number);
  const a = new Date(y, m - 1, d).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((b - a) / DAY);
}

export interface Wird {
  from: number;
  to: number;
  target: number;
  readToday: number;
  done: boolean;
  perDay: number;
  dayIndex: number;
  // كم وردًا متأخرًا (موجب) أو متقدمًا (سالب) عن الخطة في بداية اليوم
  behind: number;
  streak: number;
  progress: number;
}

// ورد اليوم وحالة الختمة، محسوبة من الحالة المخزنة فقط
export function computeWird(s: Pick<QuranStore, "days" | "nextPage" | "startedAt" | "log" | "today">, now = new Date()): Wird {
  const key = todayKey(now);
  const perDay = pagesPerDay(s.days);
  const from = s.today?.date === key ? s.today.from : s.nextPage;
  // الورد ينتهي عند حدّ وحدة الخطة (نهاية الجزء في خطة الشهر)، فإن بدأت من منتصفه كان أقصر
  const { index, end: to } = wirdAt(s.days, from);
  const target = to - from + 1;
  const readToday = s.log[key] ?? 0;
  const dayIndex = daysBetween(s.startedAt, now) + 1;
  const behind = dayIndex - 1 - index;

  let streak = 0;
  const cursor = new Date(now);
  if (!readToday) cursor.setDate(cursor.getDate() - 1); // اليوم لم ينتهِ بعد فلا يقطع السلسلة
  while ((s.log[todayKey(cursor)] ?? 0) > 0) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    from,
    to,
    target,
    readToday,
    done: readToday >= target,
    perDay,
    dayIndex,
    behind,
    streak,
    progress: (s.nextPage - 1) / TOTAL_PAGES,
  };
}

export function useWird(now?: Date) {
  const days = useQuran((s) => s.days);
  const nextPage = useQuran((s) => s.nextPage);
  const startedAt = useQuran((s) => s.startedAt);
  const log = useQuran((s) => s.log);
  const today = useQuran((s) => s.today);
  return computeWird({ days, nextPage, startedAt, log, today }, now);
}
