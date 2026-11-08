"use client";

import { useRef } from "react";
import Link from "next/link";
import { Check, ChevronRight, RotateCcw } from "lucide-react";
import { dhikrKey, getCategory, type Dhikr } from "@/lib/adhkar";
import { num, todayKey } from "@/lib/format";
import { useDhikrCount, useProgress } from "@/store/progress";

export function DhikrReader({ categoryId }: { categoryId: number }) {
  const cat = getCategory(categoryId);
  const resetDhikr = useProgress((s) => s.resetDhikr);
  const hydratedDone = useProgress((s) =>
    cat && s.day === todayKey() ? cat.items.filter((i) => (s.dhikr[dhikrKey(cat.id, i.id)] ?? 0) >= i.count).length : 0
  );
  const listRef = useRef<HTMLOListElement>(null);
  if (!cat) return null;

  const total = cat.items.length;
  const complete = hydratedDone === total;

  // بعد إتمام ذكر ننتقل تلقائيًا إلى الذي يليه
  const goNext = (index: number) => {
    const next = listRef.current?.children[index + 1] as HTMLElement | undefined;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    next?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="sticky top-0 z-20 -mx-4 -mt-[max(1rem,env(safe-area-inset-top))] flex flex-col gap-3 bg-base/85 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Link
            href="/adhkar"
            aria-label="العودة إلى الأذكار"
            className="-ms-2 flex size-10 items-center justify-center rounded-full hover:bg-surface"
          >
            <ChevronRight aria-hidden className="size-6" />
          </Link>
          <h1 className="font-naskh flex-1 text-2xl font-bold">{cat.category}</h1>
          <button
            type="button"
            onClick={() => resetDhikr(cat.items.map((i) => dhikrKey(cat.id, i.id)))}
            aria-label="البدء من جديد"
            className="flex size-10 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-fg"
          >
            <RotateCcw aria-hidden className="size-5" />
          </button>
        </div>
        <div className="flex items-center gap-3" aria-label={`أتممت ${num(hydratedDone)} من ${num(total)}`}>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
            <span
              className="block h-full rounded-full bg-accent transition-[width] duration-300"
              style={{ width: `${(hydratedDone / total) * 100}%` }}
            />
          </span>
          <span className="text-sm text-muted tabular-nums">
            {num(hydratedDone)} / {num(total)}
          </span>
        </div>
      </header>

      <ol ref={listRef} className="flex flex-col gap-4">
        {cat.items.map((item, index) => (
          <DhikrItem key={item.id} categoryId={cat.id} item={item} onComplete={() => goNext(index)} />
        ))}
      </ol>

      {complete && (
        <p role="status" className="rounded-3xl bg-accent px-5 py-4 text-center font-semibold text-accent-ink">
          أتممت {cat.category}. تقبّل الله منك.
        </p>
      )}

      <p className="text-center text-xs leading-relaxed text-muted">
        المصدر: حصن المسلم — سعيد بن علي بن وهف القحطاني
      </p>
    </div>
  );
}

function DhikrItem({ categoryId, item, onComplete }: { categoryId: number; item: Dhikr; onComplete: () => void }) {
  const key = dhikrKey(categoryId, item.id);
  const count = useDhikrCount(key);
  const countDhikr = useProgress((s) => s.countDhikr);
  const done = count >= item.count;
  const remaining = item.count - count;

  const tap = () => {
    if (done) return;
    countDhikr(key, item.count);
    if ("vibrate" in navigator) navigator.vibrate(count + 1 >= item.count ? 40 : 8);
    if (count + 1 >= item.count) onComplete();
  };

  return (
    <li
      className={`rounded-3xl border bg-surface p-5 backdrop-blur-md transition-opacity duration-300 ${
        done ? "border-line opacity-75" : "border-line"
      }`}
    >
      {/* الضغط على النص نفسه يعدّ، كما في المسبحة */}
      <button
        type="button"
        onClick={tap}
        disabled={done}
        className="font-naskh block w-full text-start text-[1.35rem] leading-[2.15] disabled:cursor-default"
        aria-label={done ? undefined : `اضغط للعدّ، بقي ${num(remaining)}`}
      >
        {item.text}
      </button>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div className="min-w-0 flex-1 text-sm text-muted">
          {(item.fadl || item.source) && (
            <details>
              <summary className="w-fit">الفضل والمصدر</summary>
              {item.fadl && <p className="mt-2 leading-relaxed">{item.fadl}</p>}
              {item.source && <p className="mt-1 text-xs">{item.source}</p>}
            </details>
          )}
        </div>
        <button
          type="button"
          onClick={tap}
          disabled={done}
          aria-label={done ? "تم" : `عدّ، بقي ${num(remaining)} من ${num(item.count)}`}
          className={`flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold tabular-nums transition-colors duration-200 ${
            done ? "bg-accent text-accent-ink" : "border-2 border-accent text-fg active:bg-accent active:text-accent-ink"
          }`}
        >
          {done ? <Check aria-hidden className="size-6" /> : num(remaining)}
        </button>
      </div>
    </li>
  );
}
