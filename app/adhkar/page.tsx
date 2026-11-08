"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Search } from "lucide-react";
import { fieldClass } from "@/components/location-picker";
import { CATEGORIES, CATEGORY_IDS, dhikrKey, getCategory, normalizeArabic, type DhikrCategory } from "@/lib/adhkar";
import { num, todayKey } from "@/lib/format";
import { useProgress } from "@/store/progress";

const FEATURED = [
  CATEGORY_IDS.morning,
  CATEGORY_IDS.evening,
  CATEGORY_IDS.afterPrayer,
  CATEGORY_IDS.sleep,
  CATEGORY_IDS.waking,
] as const;

function useDoneCount(cat: DhikrCategory) {
  return useProgress((s) =>
    s.day === todayKey() ? cat.items.filter((i) => (s.dhikr[dhikrKey(cat.id, i.id)] ?? 0) >= i.count).length : 0
  );
}

export default function AdhkarPage() {
  const [query, setQuery] = useState("");
  const q = normalizeArabic(query);

  const results = useMemo(() => {
    const rest = CATEGORIES.filter((c) => !(FEATURED as readonly number[]).includes(c.id));
    if (!q) return rest;
    return CATEGORIES.filter(
      (c) => normalizeArabic(c.category).includes(q) || c.items.some((i) => normalizeArabic(i.text).includes(q))
    );
  }, [q]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-naskh text-3xl font-bold">الأذكار</h1>
        <p className="mt-1 text-sm text-muted">من حصن المسلم</p>
      </header>

      <label className="relative block">
        <span className="sr-only">ابحث في الأذكار</span>
        <Search aria-hidden className="pointer-events-none absolute inset-y-0 start-4 my-auto size-5 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث: سفر، مطر، هم…"
          className={`${fieldClass} ps-12 backdrop-blur-md`}
        />
      </label>

      {!q && (
        <section aria-label="الأذكار اليومية" className="grid grid-cols-2 gap-3">
          {FEATURED.map((id, i) => {
            const cat = getCategory(id);
            return cat ? <FeaturedTile key={id} cat={cat} wide={i === 0} /> : null;
          })}
        </section>
      )}

      <section aria-label={q ? "نتائج البحث" : "أذكار المواقف"}>
        {!q && <h2 className="mb-3 text-sm text-muted">أذكار المواقف والأحوال</h2>}
        {results.length === 0 ? (
          <p className="rounded-3xl border border-line bg-surface p-5 text-muted">لا توجد نتائج لـ «{query}». جرّب كلمة أقصر.</p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface backdrop-blur-md">
            {results.map((c) => (
              <li key={c.id}>
                <Link href={`/adhkar/${c.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface">
                  <span className="flex-1">{c.category}</span>
                  <span className="text-sm text-muted tabular-nums">{num(c.items.length)}</span>
                  <ChevronLeft aria-hidden className="size-4 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function FeaturedTile({ cat, wide }: { cat: DhikrCategory; wide: boolean }) {
  const done = useDoneCount(cat);
  const total = cat.items.length;
  const complete = done === total;
  return (
    <Link
      href={`/adhkar/${cat.id}`}
      className={`flex flex-col justify-between gap-6 rounded-3xl border p-5 backdrop-blur-md transition-colors duration-200 ${
        wide ? "col-span-2 min-h-36" : "min-h-32"
      } ${complete ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface hover:border-accent"}`}
    >
      <span className={`font-naskh font-bold ${wide ? "text-3xl" : "text-xl"}`}>{cat.category}</span>
      <span className="flex items-center gap-3">
        <span className="h-1 flex-1 overflow-hidden rounded-full bg-current/15">
          <span
            className="block h-full rounded-full bg-current transition-[width] duration-300"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </span>
        <span className="text-sm tabular-nums">
          {complete ? "أتممتها" : `${num(done)} / ${num(total)}`}
        </span>
      </span>
    </Link>
  );
}
