"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { num } from "@/lib/format";
import { TOTAL_PAGES, clampPage, fetchPage, juzOfPage, pageStart, splitBasmala, surahName, type Ayah } from "@/lib/quran";
import { useQuran, useWird } from "@/store/quran";
import { toast } from "@/store/toasts";

type State = { status: "loading" } | { status: "error"; offline: boolean } | { status: "ready"; ayahs: Ayah[] };

export function QuranReader() {
  const params = useSearchParams();
  const router = useRouter();
  const page = clampPage(Number(params.get("p") ?? 1));
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const hydrated = useQuran((s) => s.hydrated);
  const setBookmark = useQuran((s) => s.setBookmark);
  const readUntil = useQuran((s) => s.readUntil);
  const nextPage = useQuran((s) => s.nextPage);
  const wird = useWird();

  useEffect(() => {
    const ctrl = new AbortController();
    setState({ status: "loading" });
    fetchPage(page, ctrl.signal)
      .then((ayahs) => setState({ status: "ready", ayahs }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState({ status: "error", offline: !navigator.onLine });
      });
    window.scrollTo({ top: 0 });
    return () => ctrl.abort();
  }, [page, attempt]);

  // نحفظ آخر صفحة مفتوحة لنعود إليها
  useEffect(() => {
    if (hydrated) setBookmark(page);
  }, [page, hydrated, setBookmark]);

  const go = useCallback((p: number) => router.replace(`/quran/read/?p=${clampPage(p)}`, { scroll: false }), [router]);

  // في المصحف العربي الصفحة التالية على اليسار
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft" && page < TOTAL_PAGES) go(page + 1);
      if (e.key === "ArrowRight" && page > 1) go(page - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [page, go]);

  // السحب لليمين يقلب للصفحة التالية كما في المصحف الورقي
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY });
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx)) return;
    if (dx > 0 && page < TOTAL_PAGES) go(page + 1);
    if (dx < 0 && page > 1) go(page - 1);
  };

  const inWird = !wird.done && page >= wird.from && page <= wird.to;
  const start = pageStart(page);

  const markHere = () => {
    const khatma = readUntil(page);
    const finishedWird = !wird.done && page >= wird.to;
    toast(
      khatma
        ? { title: "ختمت القرآن الكريم", body: "تقبّل الله منك." }
        : finishedWird
          ? { title: "أتممت ورد اليوم", body: "تقبّل الله منك." }
          : { title: `سُجّلت قراءتك حتى صفحة ${num(page)}` }
    );
    if (finishedWird || khatma) router.push("/quran/");
    else go(page + 1);
  };

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="flex flex-col gap-5">
      <header className="sticky top-0 z-20 -mx-4 -mt-[max(1rem,env(safe-area-inset-top))] flex items-center gap-2 bg-base/85 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur-xl">
        <Link href="/quran/" aria-label="إغلاق القراءة" className="-ms-2 flex size-10 items-center justify-center rounded-full hover:bg-surface">
          <X aria-hidden className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="font-naskh truncate text-xl font-bold">سورة {surahName(start.surah)}</p>
          <p className="text-xs text-muted">
            صفحة {num(page)} · الجزء {num(juzOfPage(page))}
            {inWird && ` · ${num(page - wird.from + 1)} من ${num(wird.to - wird.from + 1)} في ورد اليوم`}
          </p>
        </div>
      </header>

      {inWird && (
        <div className="h-1 overflow-hidden rounded-full bg-line" aria-hidden>
          <div className="h-full rounded-full bg-accent" style={{ width: `${((page - wird.from + 1) / (wird.to - wird.from + 1)) * 100}%` }} />
        </div>
      )}

      <article
        lang="ar"
        aria-label={`صفحة ${page}`}
        className="min-h-[60vh] rounded-3xl border border-line bg-surface px-5 py-6 backdrop-blur-md"
      >
        {state.status === "loading" && (
          <div aria-busy className="flex flex-col gap-4">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="h-6 animate-pulse rounded-full bg-line" />
            ))}
          </div>
        )}
        {state.status === "error" && (
          <div role="alert" className="flex flex-col items-center gap-4 py-16 text-center">
            <p>
              {state.offline
                ? "أنت غير متصل، وهذه الصفحة لم تُحمَّل من قبل. صفحات ورد اليوم تُحمَّل تلقائيًا عند فتح صفحة الورد وأنت متصل."
                : "تعذّر تحميل الصفحة."}
            </p>
            <button
              type="button"
              onClick={() => setAttempt((a) => a + 1)}
              className="rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-ink"
            >
              إعادة المحاولة
            </button>
          </div>
        )}
        {state.status === "ready" && <PageText ayahs={state.ayahs} />}
      </article>

      {hydrated && page >= nextPage && (
        <button
          type="button"
          onClick={markHere}
          className={`flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold ${
            inWird && page === wird.to ? "bg-accent text-accent-ink" : "border border-line hover:bg-surface"
          }`}
        >
          <Check aria-hidden className="size-5" />
          {inWird && page === wird.to ? "أتممت ورد اليوم" : "قرأت حتى هذه الصفحة"}
        </button>
      )}

      <nav aria-label="تقليب الصفحات" className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => go(page - 1)}
          disabled={page <= 1}
          className="flex min-h-12 items-center gap-1 rounded-full border border-line px-4 disabled:opacity-40"
        >
          <ChevronRight aria-hidden className="size-5" />
          السابقة
        </button>
        <span className="text-sm text-muted tabular-nums">
          {num(page)} / {num(TOTAL_PAGES)}
        </span>
        <button
          type="button"
          onClick={() => go(page + 1)}
          disabled={page >= TOTAL_PAGES}
          className="flex min-h-12 items-center gap-1 rounded-full border border-line px-4 disabled:opacity-40"
        >
          التالية
          <ChevronLeft aria-hidden className="size-5" />
        </button>
      </nav>
    </div>
  );
}

function PageText({ ayahs }: { ayahs: Ayah[] }) {
  // نجمع الآيات المتتالية من السورة نفسها في فقرة واحدة، ونفصل عند بداية سورة جديدة
  const blocks: { surah: number; starts: boolean; ayahs: Ayah[] }[] = [];
  for (const a of ayahs) {
    const last = blocks[blocks.length - 1];
    if (!last || a.numberInSurah === 1) blocks.push({ surah: a.surah, starts: a.numberInSurah === 1, ayahs: [a] });
    else last.ayahs.push(a);
  }

  return (
    <div className="flex flex-col gap-5">
      {blocks.map((b, i) => {
        const first = b.starts ? splitBasmala(b.ayahs[0]) : null;
        return (
          <Fragment key={`${b.surah}-${i}`}>
            {b.starts && (
              <div className="flex flex-col items-center gap-3">
                <h2 className="font-naskh w-full rounded-2xl border border-accent/60 py-2 text-center text-2xl font-bold">
                  سورة {surahName(b.surah)}
                </h2>
                {first?.basmala && <p className="font-quran text-center text-2xl">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>}
              </div>
            )}
            <p className="font-quran text-justify text-[1.6rem] leading-[2.6] [text-align-last:center]">
              {b.ayahs.map((a, j) => (
                <Fragment key={a.number}>
                  {j === 0 && first ? first.text : a.text}
                  <span className="text-accent" aria-label={`آية ${a.numberInSurah}${a.sajda ? "، سجدة" : ""}`}>
                    {" "}
                    ﴿{num(a.numberInSurah)}﴾{a.sajda ? " ۩" : ""}{" "}
                  </span>
                </Fragment>
              ))}
            </p>
          </Fragment>
        );
      })}
      <p className="text-center text-xs text-muted">النص العثماني من Tanzil عبر api.alquran.cloud</p>
    </div>
  );
}
