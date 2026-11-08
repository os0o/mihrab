"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Check, Flame } from "lucide-react";
import { fieldClass } from "@/components/location-picker";
import { useNow } from "@/hooks/useNow";
import { num, todayKey } from "@/lib/format";
import { KHATMA_PLANS, TOTAL_PAGES, juzOfPage, prefetchPages, rangeLabel } from "@/lib/quran";
import { useQuran, useWird } from "@/store/quran";
import { toast } from "@/store/toasts";

export default function QuranPage() {
  const hydrated = useQuran((s) => s.hydrated);
  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-naskh text-3xl font-bold">الورد اليومي</h1>
      </header>
      {hydrated ? <WirdContent /> : <div aria-busy className="h-72 animate-pulse rounded-3xl bg-surface" />}
    </div>
  );
}

function WirdContent() {
  const now = useNow(60_000);
  const wird = useWird(now);
  const bookmark = useQuran((s) => s.bookmark);
  const nextPage = useQuran((s) => s.nextPage);
  const khatmas = useQuran((s) => s.khatmas);
  const readUntil = useQuran((s) => s.readUntil);

  // تحميل صفحات اليوم مسبقًا لتُقرأ دون اتصال
  useEffect(() => {
    if (wird.done || !navigator.onLine) return;
    const ctrl = new AbortController();
    void prefetchPages(Math.max(wird.from, nextPage), wird.to, ctrl.signal);
    return () => ctrl.abort();
  }, [wird.from, wird.to, wird.done, nextPage]);

  const resumeAt = bookmark && bookmark >= wird.from && bookmark <= wird.to ? bookmark : Math.max(nextPage, wird.from);
  const started = nextPage > wird.from && !wird.done;

  const finish = () => {
    const khatma = readUntil(wird.to);
    toast(
      khatma
        ? { title: "ختمت القرآن الكريم", body: "تقبّل الله منك. تبدأ ختمتك الجديدة من الفاتحة غدًا." }
        : { title: "أتممت ورد اليوم", body: "تقبّل الله منك." }
    );
  };

  return (
    <>
      <section aria-labelledby="wird-title" className="flex flex-col items-center text-center">
        <p className="text-sm text-muted">
          اليوم {num(wird.dayIndex)} من الختمة · الجزء {num(juzOfPage(wird.from))}
        </p>
        <h2 id="wird-title" className="mt-4 flex flex-col items-center">
          <span className="text-sm text-muted">{wird.from === wird.to ? "صفحة" : "الصفحات"}</span>
          <span className="font-naskh text-6xl leading-tight font-bold whitespace-nowrap tabular-nums">
            {wird.from === wird.to ? num(wird.from) : `${num(wird.from)} – ${num(wird.to)}`}
          </span>
        </h2>
        <p className="font-naskh mt-2 text-xl">{rangeLabel(wird.from, wird.to)}</p>

        <div className="mt-6 flex w-full flex-col gap-3">
          {wird.done ? (
            <p role="status" className="flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 font-semibold text-accent-ink">
              <Check aria-hidden className="size-5" />
              أتممت ورد اليوم
            </p>
          ) : (
            <>
              <Link
                href={`/quran/read/?p=${resumeAt}`}
                className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 font-semibold text-accent-ink"
              >
                <BookOpen aria-hidden className="size-5" />
                {started || bookmark ? `تابع القراءة من صفحة ${num(resumeAt)}` : "ابدأ القراءة"}
              </Link>
              <button type="button" onClick={finish} className="min-h-12 rounded-full border border-line px-6 py-3 font-medium hover:bg-surface">
                قرأته من مصحفي، أتممت الورد
              </button>
            </>
          )}
          {wird.done && (
            <Link href={`/quran/read/?p=${nextPage}`} className="text-sm text-muted underline underline-offset-4">
              زيادة قراءة من صفحة {num(nextPage)}
            </Link>
          )}
        </div>
      </section>

      <KhatmaProgress progress={wird.progress} nextPage={nextPage} behind={wird.behind} streak={wird.streak} khatmas={khatmas} />
      <ReadingMap />
      <WirdSettings />
    </>
  );
}

function KhatmaProgress({
  progress,
  nextPage,
  behind,
  streak,
  khatmas,
}: {
  progress: number;
  nextPage: number;
  behind: number;
  streak: number;
  khatmas: number;
}) {
  const status = behind > 0 ? `متأخر ${num(behind)} ${behind === 1 ? "ورد" : "أوراد"} عن الخطة` : behind < 0 ? "متقدّم على الخطة" : "على الخطة";
  return (
    <section aria-labelledby="khatma-title" className="rounded-3xl border border-line bg-surface p-5 backdrop-blur-md">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="khatma-title" className="font-semibold">
          الختمة الحالية
        </h2>
        <span className="text-2xl font-semibold tabular-nums">{num(Math.floor(progress * 100))}٪</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-line" aria-hidden>
        <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
        <div>
          <dt className="text-muted">وصلت إلى</dt>
          <dd className="mt-1 font-semibold">صفحة {num(Math.min(nextPage, TOTAL_PAGES))}</dd>
        </div>
        <div>
          <dt className="text-muted">أيام متتالية</dt>
          <dd className="mt-1 flex items-center justify-center gap-1 font-semibold">
            {num(streak)}
            {streak > 0 && <Flame aria-hidden className="size-4 text-accent" />}
          </dd>
        </div>
        <div>
          <dt className="text-muted">ختمات سابقة</dt>
          <dd className="mt-1 font-semibold">{num(khatmas)}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm text-muted">{status}</p>
    </section>
  );
}

// آخر ٥ أسابيع: كل مربع يوم، ويشتد لونه بقدر ما قُرئ
function ReadingMap() {
  const log = useQuran((s) => s.log);
  const days = useQuran((s) => s.days);
  const perDay = Math.ceil(TOTAL_PAGES / days);
  const cells = Array.from({ length: 35 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (34 - i));
    const pages = log[todayKey(d)] ?? 0;
    return { key: todayKey(d), pages, level: pages === 0 ? 0 : Math.min(1, pages / perDay) };
  });
  const active = cells.filter((c) => c.pages > 0).length;

  return (
    <section aria-labelledby="map-title">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="map-title" className="font-semibold">
          أيام القراءة
        </h2>
        <span className="text-sm text-muted">
          {num(active)} من آخر {num(35)} يومًا
        </span>
      </div>
      <ol className="grid grid-cols-7 gap-1.5" aria-label="خريطة أيام القراءة لآخر خمسة أسابيع">
        {cells.map((c) => (
          <li
            key={c.key}
            title={`${c.key}: ${num(c.pages)} صفحة`}
            className="aspect-square rounded-md border border-line"
            style={{ background: c.level ? `color-mix(in srgb, var(--accent) ${30 + c.level * 70}%, transparent)` : undefined }}
          >
            <span className="sr-only">
              {c.key}: {num(c.pages)} صفحة
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function WirdSettings() {
  const days = useQuran((s) => s.days);
  const setDays = useQuran((s) => s.setDays);
  const reminder = useQuran((s) => s.reminder);
  const setReminder = useQuran((s) => s.setReminder);
  const restart = useQuran((s) => s.restart);
  const [startPage, setStartPage] = useState("");

  return (
    <section aria-labelledby="wird-settings" className="rounded-3xl border border-line bg-surface p-5 backdrop-blur-md">
      <h2 id="wird-settings" className="mb-4 font-semibold">
        إعدادات الورد
      </h2>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm text-muted">
          أختم القرآن كل
          <select className={fieldClass} value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {KHATMA_PLANS.map((p) => (
              <option key={p.days} value={p.days}>
                {p.label} — نحو {num(Math.round(TOTAL_PAGES / p.days))} صفحة يوميًا
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-muted">
          تذكير يومي بالورد
          <input
            type="time"
            className={fieldClass}
            value={reminder}
            onChange={(e) => setReminder(e.target.value)}
          />
        </label>
        {reminder && (
          <button type="button" onClick={() => setReminder("")} className="w-fit text-sm text-muted underline underline-offset-4">
            إيقاف التذكير
          </button>
        )}
        <details className="border-t border-line pt-4">
          <summary className="text-sm text-muted">بدء ختمة جديدة أو من صفحة معيّنة</summary>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const p = Number(startPage || 1);
              if (!Number.isInteger(p) || p < 1 || p > TOTAL_PAGES) {
                toast({ title: "رقم صفحة غير صحيح", body: `أدخل رقمًا من ١ إلى ${num(TOTAL_PAGES)}.` });
                return;
              }
              restart(p);
              toast({ title: "بدأت ختمة جديدة", body: `من صفحة ${num(p)}` });
              setStartPage("");
            }}
          >
            <label className="sr-only" htmlFor="start-page">
              صفحة البداية
            </label>
            <input
              id="start-page"
              inputMode="numeric"
              dir="ltr"
              placeholder="1"
              value={startPage}
              onChange={(e) => setStartPage(e.target.value)}
              className={`${fieldClass} w-24 text-center`}
            />
            <button type="submit" className="flex-1 rounded-2xl border border-line px-4 py-3 font-medium hover:bg-surface">
              ابدأ من هذه الصفحة
            </button>
          </form>
        </details>
      </div>
    </section>
  );
}
