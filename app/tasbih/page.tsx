"use client";

import { RotateCcw } from "lucide-react";
import { num } from "@/lib/format";
import { useProgress } from "@/store/progress";
import { useSettings } from "@/store/settings";
import { toast } from "@/store/toasts";

interface Phrase {
  text: string;
  target: number;
}

// تسبيح ما بعد الصلاة كما في صحيح مسلم: ٣٣ + ٣٣ + ٣٣ وتمام المئة
const AFTER_PRAYER: Phrase[] = [
  { text: "سُبْحَانَ اللَّهِ", target: 33 },
  { text: "الْحَمْدُ لِلَّهِ", target: 33 },
  { text: "اللَّهُ أَكْبَرُ", target: 33 },
  { text: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", target: 1 },
];

const FREE: Phrase[] = [
  { text: "أَسْتَغْفِرُ اللَّهَ", target: 100 },
  { text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", target: 100 },
  { text: "لَا إِلَهَ إِلَّا اللَّهُ", target: 100 },
  { text: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", target: 100 },
  { text: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ", target: 100 },
];

const BEADS = 33;
const RING_R = 128;

export default function TasbihPage() {
  const hydrated = useSettings((s) => s.hydrated);
  const t = useProgress((s) => s.tasbih);
  const tap = useProgress((s) => s.tap);
  const setTasbih = useProgress((s) => s.setTasbih);

  const list = t.sequence ? AFTER_PRAYER : FREE;
  const phrase = list[t.phrase % list.length];
  const lit = Math.round((t.count / phrase.target) * BEADS);

  const onTap = () => {
    const done = tap(phrase.target, list.length);
    if ("vibrate" in navigator) navigator.vibrate(done ? 60 : 8);
    if (done && t.sequence && t.phrase === list.length - 1) {
      toast({ title: "أتممت تسبيح ما بعد الصلاة", body: "غُفرت خطاياه وإن كانت مثل زبد البحر — رواه مسلم" });
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <header className="w-full">
        <h1 className="font-naskh text-3xl font-bold">السبحة</h1>
      </header>

      <div role="radiogroup" aria-label="نوع التسبيح" className="flex w-full rounded-full border border-line bg-surface p-1 backdrop-blur-md">
        {[
          { value: true, label: "بعد الصلاة" },
          { value: false, label: "ذكر حر" },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            role="radio"
            aria-checked={t.sequence === opt.value}
            onClick={() => setTasbih({ sequence: opt.value, phrase: 0, count: 0 })}
            className={`flex-1 rounded-full py-2.5 text-sm font-medium transition-colors duration-200 ${
              t.sequence === opt.value ? "bg-accent text-accent-ink" : "text-muted"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {!t.sequence && (
        <div className="flex w-full gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label="الذكر">
          {FREE.map((p, i) => (
            <button
              key={p.text}
              type="button"
              role="radio"
              aria-checked={t.phrase === i}
              onClick={() => setTasbih({ phrase: i, count: 0 })}
              className={`font-naskh shrink-0 rounded-full border px-4 py-2 text-base ${
                t.phrase === i ? "border-accent text-fg" : "border-line text-muted"
              }`}
            >
              {p.text}
            </button>
          ))}
        </div>
      )}

      <p className="font-naskh min-h-[4.5rem] max-w-sm text-center text-2xl leading-relaxed font-bold" aria-live="polite">
        {phrase.text}
      </p>

      {/* الدائرة كلها زر كبير: اضغط بأي مكان، أو بمفتاح المسافة */}
      <button
        type="button"
        onClick={onTap}
        disabled={!hydrated}
        aria-label={`سبّح: ${num(t.count)} من ${num(phrase.target)}`}
        className="relative aspect-square w-full max-w-[300px] touch-manipulation rounded-full select-none active:scale-[0.985] transition-transform duration-100"
      >
        <svg viewBox="-150 -150 300 300" aria-hidden className="size-full">
          <circle r={RING_R + 16} fill="var(--surface)" stroke="var(--line)" />
          {Array.from({ length: BEADS }, (_, i) => {
            const a = (i / BEADS) * Math.PI * 2 - Math.PI / 2;
            // الحبّات تُضاء مع عقارب الساعة من الأعلى
            const on = i < lit;
            return (
              <circle
                key={i}
                cx={RING_R * Math.cos(a)}
                cy={RING_R * Math.sin(a)}
                r={on ? 7 : 5.5}
                fill={on ? "var(--accent)" : "var(--fg)"}
                fillOpacity={on ? 1 : 0.18}
                className="transition-all duration-150"
              />
            );
          })}
        </svg>
        <span className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-7xl font-semibold tabular-nums">{num(t.count)}</span>
          <span className="mt-1 text-muted tabular-nums">من {num(phrase.target)}</span>
        </span>
      </button>

      {t.sequence && (
        <ol className="flex gap-2" aria-label="مراحل التسبيح">
          {AFTER_PRAYER.map((p, i) => (
            <li
              key={p.text}
              aria-current={i === t.phrase ? "step" : undefined}
              className={`h-1.5 w-10 rounded-full ${i < t.phrase ? "bg-accent" : i === t.phrase ? "bg-fg" : "bg-line"}`}
            >
              <span className="sr-only">{p.text}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="flex w-full items-center justify-between text-sm text-muted">
        <span>مجموع تسبيحك: {num(t.lifetime)}</span>
        <button
          type="button"
          onClick={() => setTasbih({ count: 0, phrase: t.sequence ? 0 : t.phrase })}
          className="flex items-center gap-1.5 rounded-full px-3 py-2 hover:bg-surface hover:text-fg"
        >
          <RotateCcw aria-hidden className="size-4" />
          تصفير
        </button>
      </div>
    </div>
  );
}
