import { create } from "zustand";
import { persist } from "zustand/middleware";
import { todayKey } from "@/lib/format";

interface ProgressStore {
  // عدّادات الأذكار لليوم فقط؛ تُصفَّر تلقائيًا مع تغيّر التاريخ
  day: string;
  dhikr: Record<string, number>;
  tasbih: { phrase: number; count: number; lifetime: number; sequence: boolean };
  countDhikr: (key: string, max: number) => void;
  resetDhikr: (keys: string[]) => void;
  tap: (target: number, phrasesInSequence: number) => boolean;
  setTasbih: (patch: Partial<ProgressStore["tasbih"]>) => void;
}

function freshDay(state: ProgressStore) {
  const key = todayKey();
  return state.day === key ? state.dhikr : {};
}

export const useProgress = create<ProgressStore>()(
  persist(
    (set, get) => ({
      day: todayKey(),
      dhikr: {},
      tasbih: { phrase: 0, count: 0, lifetime: 0, sequence: true },
      countDhikr: (key, max) =>
        set((s) => {
          const dhikr = freshDay(s);
          const current = dhikr[key] ?? 0;
          if (current >= max) return {};
          return { day: todayKey(), dhikr: { ...dhikr, [key]: current + 1 } };
        }),
      resetDhikr: (keys) =>
        set((s) => {
          const dhikr = { ...freshDay(s) };
          keys.forEach((k) => delete dhikr[k]);
          return { day: todayKey(), dhikr };
        }),
      // يعيد true عند إكمال الهدف، ويُنقل تلقائيًا للذكر التالي في وضع التسلسل
      tap: (target, phrasesInSequence) => {
        const t = get().tasbih;
        const count = t.count + 1;
        const done = count >= target;
        const next = done
          ? t.sequence
            ? { phrase: (t.phrase + 1) % phrasesInSequence, count: 0 }
            : { phrase: t.phrase, count: 0 }
          : { phrase: t.phrase, count };
        set({ tasbih: { ...t, ...next, lifetime: t.lifetime + 1 } });
        return done;
      },
      setTasbih: (patch) => set((s) => ({ tasbih: { ...s.tasbih, ...patch } })),
    }),
    { name: "mihrab-progress", skipHydration: true }
  )
);

// قراءة آمنة لعدّاد اليوم (إن كانت البيانات المخزنة من يوم سابق تُعامل كصفر)
export function useDhikrCount(key: string) {
  return useProgress((s) => (s.day === todayKey() ? (s.dhikr[key] ?? 0) : 0));
}
