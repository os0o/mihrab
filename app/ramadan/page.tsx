"use client";

import { useMemo } from "react";
import { LocationGate } from "@/components/location-gate";
import { useNow } from "@/hooks/useNow";
import { useCalcOptions, useTimes } from "@/hooks/useTimes";
import { getCategory, CATEGORY_IDS } from "@/lib/adhkar";
import { clock, countdown, countdownSpoken, num, shortDay, todayKey } from "@/lib/format";
import { findRamadan, hijriLabel, hijriParts } from "@/lib/hijri";
import { addDays, computeDay } from "@/lib/prayer";
import { useSettings } from "@/store/settings";

// الإمساك قبل الفجر بعشر دقائق احتياطًا، كما في التقاويم الشائعة
const IMSAK_MIN = 10;

export default function RamadanPage() {
  return (
    <>
      <header>
        <h1 className="font-naskh text-3xl font-bold">رمضان</h1>
      </header>
      <LocationGate reason="نحتاج موقعك لحساب أوقات السحور والإفطار.">
        <RamadanContent />
      </LocationGate>
    </>
  );
}

function RamadanContent() {
  const now = useNow(1000);
  const times = useTimes(now);
  const location = useSettings((s) => s.location);
  const hour12 = useSettings((s) => s.hour12);
  const opts = useCalcOptions();
  const day = todayKey(now);

  const ramadan = useMemo(() => findRamadan(new Date()), [day]); // eslint-disable-line react-hooks/exhaustive-deps

  const calendar = useMemo(() => {
    if (!location) return [];
    return Array.from({ length: ramadan.days }, (_, i) => {
      const date = addDays(ramadan.start, i);
      const t = computeDay(location, date, opts);
      return { n: i + 1, date, imsak: new Date(t.fajr.getTime() - IMSAK_MIN * 60_000), fajr: t.fajr, maghrib: t.maghrib, isha: t.isha };
    });
  }, [location, opts, ramadan]);

  if (!times) return null;
  const fmt = (d: Date) => clock(d, hour12);

  return (
    <div className="mt-6 flex flex-col gap-8">
      {ramadan.inRamadan ? (
        <FastCountdown now={now} fajr={times.today.fajr} maghrib={times.today.maghrib} tomorrowFajr={times.tomorrow.fajr} day={ramadan.today} hour12={hour12} />
      ) : (
        <section className="text-center">
          <p className="text-muted">يبدأ رمضان بإذن الله</p>
          <p className="font-naskh mt-2 text-6xl font-bold">
            بعد {num(Math.max(0, Math.ceil((ramadan.start.getTime() - now.getTime()) / 86_400_000)))} يومًا
          </p>
          <p className="mt-2 text-muted">
            {hijriLabel(ramadan.start)} · {shortDay(ramadan.start)}
          </p>
          <p className="mx-auto mt-3 max-w-xs text-xs text-muted">حسب تقويم أم القرى؛ قد يختلف يومًا حسب رؤية الهلال في بلدك.</p>
        </section>
      )}

      <RamadanAlerts />

      <section aria-labelledby="cal-title">
        <h2 id="cal-title" className="mb-3 font-semibold">
          إمساكية رمضان {num(hijriParts(ramadan.start).year)} هـ
        </h2>
        <div className="overflow-hidden rounded-3xl border border-line bg-surface backdrop-blur-md">
          <table className="w-full text-center text-sm tabular-nums">
            <thead className="text-xs text-muted">
              <tr className="border-b border-line">
                <th scope="col" className="py-3 ps-4 text-start font-medium">اليوم</th>
                <th scope="col" className="py-3 font-medium">الإمساك</th>
                <th scope="col" className="py-3 font-medium">الفجر</th>
                <th scope="col" className="py-3 font-medium">المغرب</th>
                <th scope="col" className="py-3 pe-4 font-medium">العشاء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {calendar.map((row) => {
                const isToday = ramadan.inRamadan && row.n === ramadan.today;
                return (
                  <tr key={row.n} aria-current={isToday ? "date" : undefined} className={isToday ? "bg-accent text-accent-ink" : ""}>
                    <th scope="row" className="py-2.5 ps-4 text-start font-normal">
                      <span className="font-semibold">{num(row.n)}</span>
                      <span className={`ms-2 text-xs ${isToday ? "" : "text-muted"}`}>{shortDay(row.date)}</span>
                    </th>
                    <td>{fmt(row.imsak)}</td>
                    <td>{fmt(row.fajr)}</td>
                    <td className="font-semibold">{fmt(row.maghrib)}</td>
                    <td className="pe-4">{fmt(row.isha)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">الإمساك قبل الفجر بـ{num(IMSAK_MIN)} دقائق احتياطًا. الأوقات بتوقيت جهازك.</p>
      </section>

      <IftarDua />
    </div>
  );
}

function FastCountdown({
  now,
  fajr,
  maghrib,
  tomorrowFajr,
  day,
  hour12,
}: {
  now: Date;
  fajr: Date;
  maghrib: Date;
  tomorrowFajr: Date;
  day: number;
  hour12: boolean;
}) {
  // قبل الفجر: العدّ للإمساك، بين الفجر والمغرب: للإفطار، بعد المغرب: لسحور الغد
  const fasting = now >= fajr && now < maghrib;
  const target = fasting ? maghrib : now < fajr ? fajr : tomorrowFajr;
  const label = fasting ? "الإفطار" : "الإمساك والفجر";
  const remaining = target.getTime() - now.getTime();

  return (
    <section aria-labelledby="fast-title" className="text-center">
      <p className="text-muted">اليوم {num(day)} من رمضان</p>
      <h2 id="fast-title" className="font-naskh mt-1 text-5xl font-bold">
        {label}
      </h2>
      <p className="mt-2 text-5xl font-semibold tabular-nums" aria-hidden>
        {countdown(remaining)}
      </p>
      <p className="sr-only">بعد {countdownSpoken(remaining)}</p>
      <p className="mt-2 text-sm text-muted">عند {clock(target, hour12)}</p>
      {fasting && (
        <div className="mx-auto mt-5 h-1.5 max-w-xs overflow-hidden rounded-full bg-line" aria-hidden>
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${((now.getTime() - fajr.getTime()) / (maghrib.getTime() - fajr.getTime())) * 100}%` }}
          />
        </div>
      )}
    </section>
  );
}

function RamadanAlerts() {
  const ramadan = useSettings((s) => s.ramadan);
  const set = useSettings((s) => s.set);
  return (
    <section aria-labelledby="ram-alerts" className="rounded-3xl border border-line bg-surface p-5 backdrop-blur-md">
      <h2 id="ram-alerts" className="font-semibold">
        تنبيهات رمضان
      </h2>
      <label className="mt-4 flex items-center justify-between gap-4">
        <span>تذكير السحور قبل الفجر</span>
        <select
          className="rounded-xl border border-line bg-base px-3 py-2"
          value={ramadan.suhoorBefore}
          onChange={(e) => set({ ramadan: { ...ramadan, suhoorBefore: Number(e.target.value) } })}
        >
          <option value={0}>معطّل</option>
          {[15, 30, 45, 60, 90].map((m) => (
            <option key={m} value={m}>
              {num(m)} دقيقة
            </option>
          ))}
        </select>
      </label>
      <label className="mt-4 flex items-center justify-between gap-4">
        <span>تنبيه وقت الإفطار</span>
        <input
          type="checkbox"
          className="size-5 accent-[var(--accent)]"
          checked={ramadan.iftar}
          onChange={(e) => set({ ramadan: { ...ramadan, iftar: e.target.checked } })}
        />
      </label>
      <p className="mt-3 text-xs text-muted">تعمل تلقائيًا في أيام رمضان فقط، والتطبيق مفتوح.</p>
    </section>
  );
}

function IftarDua() {
  const cat = getCategory(CATEGORY_IDS.iftar);
  if (!cat) return null;
  return (
    <section aria-labelledby="dua-title">
      <h2 id="dua-title" className="mb-3 font-semibold">
        {cat.category}
      </h2>
      <div className="flex flex-col gap-3">
        {cat.items.map((d) => (
          <blockquote key={d.id} className="font-naskh rounded-3xl border border-line bg-surface p-5 text-xl leading-[2.1] backdrop-blur-md">
            {d.text}
          </blockquote>
        ))}
      </div>
    </section>
  );
}
