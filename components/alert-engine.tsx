"use client";

import { useEffect, useMemo, useRef } from "react";
import { useNow } from "@/hooks/useNow";
import { useTimes } from "@/hooks/useTimes";
import { playAdhan, playTone, stopAdhan } from "@/lib/audio";
import { num, todayKey } from "@/lib/format";
import { hijriParts } from "@/lib/hijri";
import { showNotification } from "@/lib/notify";
import { LABELS, PRAYERS, type DayTimes } from "@/lib/prayer";
import { computeWird, useQuran } from "@/store/quran";
import { useSettings, type Settings } from "@/store/settings";
import { toast } from "@/store/toasts";

interface AlertEvent {
  id: string;
  at: Date;
  fire: () => void;
}

const MIN = 60_000;
// نافذة الإطلاق: لو تأخر المؤقّت (تبويب في الخلفية) نطلق التنبيه ما دام في الدقيقة نفسها
const WINDOW = MIN;
const FIRED_KEY = "mihrab-fired";

function loadFired(): Set<string> {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(FIRED_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

function saveFired(set: Set<string>) {
  try {
    sessionStorage.setItem(FIRED_KEY, JSON.stringify([...set].slice(-60)));
  } catch {
    // التخزين غير متاح: نكتفي بالذاكرة
  }
}

async function adhanFor(prayer: (typeof PRAYERS)[number], s: Settings) {
  const voice = prayer === "fajr" ? s.fajrVoice : s.voice;
  const result = await playAdhan(voice, s.volume);
  const title = `حان الآن وقت صلاة ${LABELS[prayer]}`;
  void showNotification(title, "حيّ على الصلاة", `adhan-${prayer}`);
  if (result === "blocked") {
    toast({
      id: "adhan",
      title,
      body: "منع المتصفح تشغيل الأذان تلقائيًا.",
      action: { label: "تشغيل الأذان", run: () => void playAdhan(voice, s.volume) },
      sticky: true,
    });
  } else {
    toast({ id: "adhan", title, action: { label: "إيقاف الأذان", run: stopAdhan }, sticky: true });
  }
}

function reminder(title: string, body: string, tag: string, volume: number, repeats = 2) {
  playTone(volume, repeats);
  void showNotification(title, body, tag);
  toast({ id: tag, title, body, sticky: repeats > 2 });
}

function buildEvents(day: DayTimes, s: Settings): AlertEvent[] {
  const key = todayKey(day.dhuhr);
  const events: AlertEvent[] = [];

  for (const prayer of PRAYERS) {
    const a = s.alerts[prayer];
    if (!a.enabled) continue;
    events.push({ id: `${key}:${prayer}`, at: day[prayer], fire: () => void adhanFor(prayer, s) });
    if (a.before > 0) {
      events.push({
        id: `${key}:${prayer}:before`,
        at: new Date(day[prayer].getTime() - a.before * MIN),
        fire: () =>
          reminder(`بقي ${num(a.before)} دقيقة على ${LABELS[prayer]}`, "استعد للصلاة", `before-${prayer}`, s.volume),
      });
    }
  }

  if (s.fajrAlarm > 0) {
    events.push({
      id: `${key}:fajr-alarm`,
      at: new Date(day.fajr.getTime() - s.fajrAlarm * MIN),
      fire: () =>
        reminder("منبّه الفجر", `الفجر بعد ${num(s.fajrAlarm)} دقيقة`, "fajr-alarm", s.volume, 6),
    });
  }

  if (hijriParts(day.dhuhr).month === 9) {
    if (s.ramadan.suhoorBefore > 0) {
      events.push({
        id: `${key}:suhoor`,
        at: new Date(day.fajr.getTime() - s.ramadan.suhoorBefore * MIN),
        fire: () =>
          reminder("وقت السحور", `يبقى ${num(s.ramadan.suhoorBefore)} دقيقة على الإمساك والفجر`, "suhoor", s.volume, 3),
      });
    }
    if (s.ramadan.iftar) {
      events.push({
        id: `${key}:iftar`,
        at: day.maghrib,
        fire: () => {
          void showNotification("حان وقت الإفطار", "ذهب الظمأ وابتلّت العروق وثبت الأجر إن شاء الله", "iftar");
          toast({ id: "iftar", title: "حان وقت الإفطار", body: "ذهب الظمأ وابتلّت العروق وثبت الأجر إن شاء الله" });
        },
      });
    }
  }
  return events;
}

// يعمل والتطبيق مفتوح (أو في تبويب بالخلفية)؛ الويب لا يسمح بتنبيهات مجدولة والتطبيق مغلق دون خادم
export function AlertEngine() {
  const now = useNow(1000);
  const settings = useSettings();
  const times = useTimes(now);
  const fired = useRef<Set<string> | null>(null);

  const wirdReminder = useQuran((s) => s.reminder);
  const day = todayKey(now);

  const events = useMemo(() => {
    if (!times || !settings.hydrated) return [];
    const list = [...buildEvents(times.today, settings), ...buildEvents(times.tomorrow, settings)];
    if (wirdReminder) {
      const [h, m] = wirdReminder.split(":").map(Number);
      const at = new Date();
      at.setHours(h, m, 0, 0);
      list.push({
        id: `${day}:wird`,
        at,
        fire: () => {
          // نقرأ الحالة لحظة التنبيه: إن أتم الورد فلا داعي للتذكير
          const wird = computeWird(useQuran.getState());
          if (wird.done) return;
          reminder("ورد اليوم", `الصفحات ${num(wird.from)}–${num(wird.to)}`, "wird", settings.volume);
        },
      });
    }
    return list;
  }, [times, settings, wirdReminder, day]);

  useEffect(() => {
    if (!events.length) return;
    fired.current ??= loadFired();
    const t = now.getTime();
    for (const e of events) {
      const diff = t - e.at.getTime();
      if (diff >= 0 && diff < WINDOW && !fired.current.has(e.id)) {
        fired.current.add(e.id);
        saveFired(fired.current);
        e.fire();
      }
    }
  }, [now, events]);

  return null;
}
