"use client";

import Link from "next/link";
import { Bell, BellOff, Check, ChevronLeft, MapPin, Settings } from "lucide-react";
import { LocationGate } from "@/components/location-gate";
import { SunArc } from "@/components/sun-arc";
import { useNow } from "@/hooks/useNow";
import { useTimes } from "@/hooks/useTimes";
import { getCategory, suggestedCategory } from "@/lib/adhkar";
import { clock, countdown, countdownSpoken, gregorianLabel, meridiem, num } from "@/lib/format";
import { findRamadan, hijriLabel } from "@/lib/hijri";
import { LABELS, PRAYERS, TIMELINE, nextPrayer, periodAt, type Prayer } from "@/lib/prayer";
import { rangeLabel } from "@/lib/quran";
import { useQuran, useWird } from "@/store/quran";
import { useSettings } from "@/store/settings";

export default function TodayPage() {
  return (
    <>
      <TodayHeader />
      <LocationGate reason="نحسب المواقيت على جهازك من موقعك، فتعمل حتى دون اتصال.">
        <TodayContent />
      </LocationGate>
    </>
  );
}

function TodayHeader() {
  const now = useNow(60_000);
  const location = useSettings((s) => s.location);
  const hydrated = useSettings((s) => s.hydrated);

  return (
    <header className="flex items-start justify-between gap-3">
      <div>
        <p className="font-naskh text-xl font-bold">{hijriLabel(now)}</p>
        <p className="text-sm text-muted">{gregorianLabel(now)}</p>
      </div>
      <div className="flex items-center gap-2">
        {hydrated && location && (
          <Link
            href="/settings#location"
            className="flex max-w-40 items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-2 text-sm backdrop-blur-md"
          >
            <MapPin aria-hidden className="size-4 shrink-0" />
            <span className="truncate">{location.name}</span>
          </Link>
        )}
        <Link
          href="/settings"
          aria-label="الإعدادات"
          className="flex size-10 items-center justify-center rounded-full border border-line bg-surface backdrop-blur-md"
        >
          <Settings aria-hidden className="size-5" />
        </Link>
      </div>
    </header>
  );
}

function TodayContent() {
  const now = useNow(1000);
  const times = useTimes(now);
  const hour12 = useSettings((s) => s.hour12);
  if (!times) return null;

  const next = nextPrayer(times.today, times.tomorrow, now);
  const remaining = next.at.getTime() - now.getTime();

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="next-title" className="-mx-2 mt-6 flex flex-col items-center text-center">
        <SunArc today={times.today} tomorrow={times.tomorrow} now={now} />
        <p className="mt-4 text-sm text-muted">الصلاة القادمة</p>
        <h1 id="next-title" className="font-naskh text-6xl leading-tight font-bold">
          {LABELS[next.key]}
        </h1>
        <p className="mt-1 text-4xl font-semibold tabular-nums" aria-hidden>
          {countdown(remaining)}
        </p>
        <p className="sr-only">بعد {countdownSpoken(remaining)}</p>
        <p className="mt-2 text-sm text-muted">
          الأذان {clock(next.at, hour12)}
          {hour12 && ` ${meridiem(next.at)}`}
        </p>
      </section>

      <PrayerList nextKey={next.key} now={now} />
      <Suggestions now={now} />
    </div>
  );
}

function PrayerList({ nextKey, now }: { nextKey: Prayer; now: Date }) {
  const times = useTimes(now);
  const hour12 = useSettings((s) => s.hour12);
  const alerts = useSettings((s) => s.alerts);
  const setAlert = useSettings((s) => s.setAlert);
  if (!times) return null;

  return (
    <section aria-labelledby="times-title">
      <h2 id="times-title" className="sr-only">
        مواقيت اليوم
      </h2>
      <ol className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface backdrop-blur-md">
        {TIMELINE.map((key) => {
          const at = times.today[key];
          const isPrayer = (PRAYERS as readonly string[]).includes(key);
          const isNext = key === nextKey && at > now;
          const past = at <= now;
          const alert = isPrayer ? alerts[key as Prayer] : null;
          return (
            <li
              key={key}
              aria-current={isNext ? "time" : undefined}
              className={`relative flex items-center gap-3 px-5 py-3.5 ${isNext ? "bg-accent/12" : ""}`}
            >
              {isNext && <span aria-hidden className="absolute inset-y-2 start-0 w-1 rounded-full bg-accent" />}
              <span className={`font-naskh flex-1 text-xl ${past ? "text-muted" : ""} ${isNext ? "font-bold" : ""}`}>
                {LABELS[key]}
              </span>
              <span className={`text-lg tabular-nums ${past ? "text-muted" : ""} ${isNext ? "font-semibold" : ""}`}>
                {clock(at, hour12)}
                {hour12 && <span className="ms-1 text-xs text-muted">{meridiem(at)}</span>}
              </span>
              {alert ? (
                <button
                  type="button"
                  onClick={() => setAlert(key as Prayer, { enabled: !alert.enabled })}
                  aria-pressed={alert.enabled}
                  aria-label={`أذان ${LABELS[key]}`}
                  className="-me-2 flex size-10 items-center justify-center rounded-full text-muted hover:text-fg"
                >
                  {alert.enabled ? (
                    <Bell aria-hidden className="size-[18px] text-fg" />
                  ) : (
                    <BellOff aria-hidden className="size-[18px]" />
                  )}
                </button>
              ) : (
                <span className="-me-2 size-10" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Suggestions({ now }: { now: Date }) {
  const times = useTimes(now);
  if (!times) return null;
  const period = periodAt(times.today, now);
  const cat = getCategory(suggestedCategory(period));
  const ramadan = findRamadan(now);
  const daysToRamadan = Math.ceil((ramadan.start.getTime() - now.getTime()) / 86_400_000);

  return (
    <section aria-label="اقتراحات" className="flex flex-col gap-3">
      <WirdCard />
      {cat && (
        <Link
          href={`/adhkar/${cat.id}`}
          className="flex items-center justify-between gap-3 rounded-3xl border border-line bg-surface px-5 py-4 backdrop-blur-md hover:border-accent"
        >
          <span>
            <span className="block text-sm text-muted">ذكر هذا الوقت</span>
            <span className="font-naskh text-xl font-bold">{cat.category}</span>
          </span>
          <ChevronLeft aria-hidden className="size-5 text-muted" />
        </Link>
      )}
      {(ramadan.inRamadan || daysToRamadan <= 30) && (
        <Link
          href="/ramadan"
          className="flex items-center justify-between gap-3 rounded-3xl bg-accent px-5 py-4 text-accent-ink"
        >
          <span className="font-semibold">
            {ramadan.inRamadan ? `اليوم ${num(ramadan.today)} من رمضان` : `رمضان بعد ${num(daysToRamadan)} يومًا`}
          </span>
          <ChevronLeft aria-hidden className="size-5" />
        </Link>
      )}
    </section>
  );
}

function WirdCard() {
  const wird = useWird();
  const hydrated = useQuran((s) => s.hydrated);
  if (!hydrated) return null;
  return (
    <Link
      href="/quran"
      className="flex items-center justify-between gap-3 rounded-3xl border border-line bg-surface px-5 py-4 backdrop-blur-md hover:border-accent"
    >
      <span className="min-w-0">
        <span className="block text-sm text-muted">
          {wird.done ? "أتممت ورد اليوم" : `ورد اليوم · الصفحات ${num(wird.from)}–${num(wird.to)}`}
        </span>
        <span className="font-naskh block truncate text-xl font-bold">{rangeLabel(wird.from, wird.to)}</span>
      </span>
      {wird.done ? (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink">
          <Check aria-hidden className="size-5" />
        </span>
      ) : (
        <ChevronLeft aria-hidden className="size-5 shrink-0 text-muted" />
      )}
    </Link>
  );
}
