"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, Minus, Pause, Play, Plus, Trash2, Upload } from "lucide-react";
import { LocationPicker } from "@/components/location-picker";
import {
  BUILTIN_VOICES,
  addCustomVoice,
  isAdhanPlaying,
  listCustomVoices,
  playAdhan,
  removeCustomVoice,
  stopAdhan,
  type Voice,
} from "@/lib/audio";
import { num } from "@/lib/format";
import { notificationsSupported, requestNotifications } from "@/lib/notify";
import { LABELS, METHODS, PRAYERS, TIMELINE, type MethodKey } from "@/lib/prayer";
import { useSettings } from "@/store/settings";
import { toast } from "@/store/toasts";

const selectClass = "rounded-xl border border-line bg-base px-3 py-2 text-fg";

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id ?? title}-h`} className="scroll-mt-6">
      <h2 id={`${id ?? title}-h`} className="mb-3 text-sm font-medium text-muted">
        {title}
      </h2>
      <div className="rounded-3xl border border-line bg-surface p-5 backdrop-blur-md">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p>{label}</p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const s = useSettings();

  if (!s.hydrated) return <div aria-busy className="mt-10 h-96 animate-pulse rounded-3xl bg-surface" />;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center gap-2">
        <Link href="/" aria-label="العودة" className="-ms-2 flex size-10 items-center justify-center rounded-full hover:bg-surface">
          <ChevronRight aria-hidden className="size-6" />
        </Link>
        <h1 className="font-naskh text-3xl font-bold">الإعدادات</h1>
      </header>

      <Section id="location" title="الموقع">
        {s.location && (
          <p className="mb-4 text-sm">
            الحالي: <strong>{s.location.name}</strong>{" "}
            <span dir="ltr" className="text-muted tabular-nums">
              ({s.location.latitude.toFixed(3)}, {s.location.longitude.toFixed(3)})
            </span>
          </p>
        )}
        <LocationPicker />
      </Section>

      <Section title="طريقة الحساب">
        <div className="divide-y divide-line">
          <Row label="الجهة">
            <select className={`${selectClass} max-w-52`} value={s.method} onChange={(e) => s.set({ method: e.target.value as MethodKey })}>
              {Object.entries(METHODS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </Row>
          <Row label="وقت العصر" hint="المذهب الحنفي يؤخّر العصر">
            <select className={selectClass} value={s.madhab} onChange={(e) => s.set({ madhab: e.target.value as "shafi" | "hanafi" })}>
              <option value="shafi">الجمهور</option>
              <option value="hanafi">الحنفي</option>
            </select>
          </Row>
        </div>
        <details className="mt-4 border-t border-line pt-4">
          <summary className="text-sm text-muted">تعديل الأوقات يدويًا لمطابقة مسجدك</summary>
          <div className="mt-3 divide-y divide-line">
            {TIMELINE.map((key) => (
              <Row key={key} label={LABELS[key]}>
                <Stepper value={s.offsets[key]} onChange={(v) => s.setOffset(key, v)} label={LABELS[key]} />
              </Row>
            ))}
          </div>
        </details>
      </Section>

      <AlertsSection />
      <VoicesSection />

      <Section title="العرض">
        <Row label="نظام الساعة">
          <select className={selectClass} value={s.hour12 ? "12" : "24"} onChange={(e) => s.set({ hour12: e.target.value === "12" })}>
            <option value="12">١٢ ساعة</option>
            <option value="24">٢٤ ساعة</option>
          </select>
        </Row>
      </Section>

      <Section title="عن التطبيق">
        <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted">
          <p>المواقيت تُحسب على جهازك بمكتبة adhan، والتاريخ الهجري من تقويم أم القرى. لا يجمع التطبيق أي بيانات ولا يرسلها.</p>
          <p>
            الأذكار من «حصن المسلم» عبر مستودعات مفتوحة المصدر (رخصة MIT). تطبيقات الويب لا تستطيع إطلاق الأذان والتطبيق
            مغلق تمامًا؛ أبقِه مفتوحًا أو مثبّتًا في الخلفية لتصلك التنبيهات.
          </p>
          <button
            type="button"
            onClick={() => {
              if (confirm("إعادة كل الإعدادات إلى الوضع الافتراضي؟")) s.reset();
            }}
            className="mt-2 w-fit rounded-full border border-line px-4 py-2 text-fg hover:bg-surface"
          >
            إعادة ضبط الإعدادات
          </button>
        </div>
      </Section>
    </div>
  );
}

function Stepper({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" aria-label={`تأخير ${label} دقيقة`} onClick={() => onChange(Math.min(30, value + 1))} className="flex size-9 items-center justify-center rounded-full border border-line">
        <Plus aria-hidden className="size-4" />
      </button>
      <span className="w-14 text-center text-sm tabular-nums" aria-live="polite">
        {value === 0 ? "بدون" : `${value > 0 ? "+" : "−"}${num(Math.abs(value))} د`}
      </span>
      <button type="button" aria-label={`تقديم ${label} دقيقة`} onClick={() => onChange(Math.max(-30, value - 1))} className="flex size-9 items-center justify-center rounded-full border border-line">
        <Minus aria-hidden className="size-4" />
      </button>
    </div>
  );
}

function AlertsSection() {
  const s = useSettings();
  const [permission, setPermission] = useState<string>("default");

  useEffect(() => {
    setPermission(notificationsSupported() ? Notification.permission : "unsupported");
  }, []);

  return (
    <Section title="الأذان والتنبيهات">
      <div className="mb-4 rounded-2xl border border-line p-4 text-sm">
        {permission === "granted" ? (
          <p>إشعارات النظام مفعّلة.</p>
        ) : permission === "denied" ? (
          <p className="text-muted">الإشعارات محظورة. فعّلها من إعدادات الموقع في المتصفح.</p>
        ) : permission === "unsupported" ? (
          <p className="text-muted">هذا المتصفح لا يدعم الإشعارات؛ ستظهر التنبيهات داخل التطبيق فقط. على آيفون ثبّت التطبيق على الشاشة الرئيسية أولًا.</p>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p>فعّل الإشعارات لتصلك التنبيهات خارج الصفحة.</p>
            <button
              type="button"
              onClick={async () => setPermission(await requestNotifications())}
              className="shrink-0 rounded-full bg-accent px-4 py-2 font-semibold text-accent-ink"
            >
              تفعيل
            </button>
          </div>
        )}
      </div>

      <div className="divide-y divide-line">
        {PRAYERS.map((p) => (
          <div key={p} className="flex items-center gap-3 py-3 first:pt-0">
            <label className="flex flex-1 items-center gap-3">
              <input
                type="checkbox"
                className="size-5 accent-[var(--accent)]"
                checked={s.alerts[p].enabled}
                onChange={(e) => s.setAlert(p, { enabled: e.target.checked })}
              />
              <span className="font-naskh text-lg">{LABELS[p]}</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-muted">
              <span className="sr-only">تذكير قبل {LABELS[p]}</span>
              <select
                className={selectClass}
                value={s.alerts[p].before}
                disabled={!s.alerts[p].enabled}
                onChange={(e) => s.setAlert(p, { before: Number(e.target.value) })}
              >
                <option value={0}>بلا تذكير مسبق</option>
                {[5, 10, 15, 20, 30].map((m) => (
                  <option key={m} value={m}>
                    قبلها بـ{num(m)} د
                  </option>
                ))}
              </select>
            </label>
          </div>
        ))}
        <Row label="منبّه الفجر" hint="نغمة متكررة قبل الفجر لتستيقظ">
          <select className={selectClass} value={s.fajrAlarm} onChange={(e) => s.set({ fajrAlarm: Number(e.target.value) })}>
            <option value={0}>معطّل</option>
            {[10, 20, 30, 45].map((m) => (
              <option key={m} value={m}>
                قبله بـ{num(m)} د
              </option>
            ))}
          </select>
        </Row>
      </div>
    </Section>
  );
}

function VoicesSection() {
  const s = useSettings();
  const [custom, setCustom] = useState<Voice[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => void listCustomVoices().then(setCustom), []);
  useEffect(refresh, [refresh]);

  // متابعة انتهاء المعاينة لإرجاع زر التشغيل
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => !isAdhanPlaying() && playing !== "tone" && setPlaying(null), 500);
    return () => window.clearInterval(id);
  }, [playing]);
  useEffect(() => () => stopAdhan(), []);

  const voices = [...BUILTIN_VOICES, ...custom];

  const preview = async (id: string) => {
    if (playing === id) {
      stopAdhan();
      setPlaying(null);
      return;
    }
    const r = await playAdhan(id, s.volume);
    if (r === "missing") toast({ title: "تعذّر تشغيل الصوت", body: "الملف غير موجود أو بصيغة لا يدعمها المتصفح." });
    setPlaying(r === "playing" && id !== "tone" ? id : null);
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      toast({ title: "الملف ليس صوتًا", body: "اختر ملف MP3 أو M4A أو OGG." });
      return;
    }
    const v = await addCustomVoice(file);
    refresh();
    s.set({ voice: v.id });
    toast({ title: "أُضيف الصوت", body: `«${v.name}» هو الآن صوت الأذان.` });
  };

  const voiceSelect = ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) => (
    <Row label={label}>
      <div className="flex items-center gap-2">
        <select className={`${selectClass} max-w-44`} value={value} onChange={(e) => onChange(e.target.value)}>
          {voices.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void preview(value)}
          aria-label={playing === value ? "إيقاف المعاينة" : "معاينة الصوت"}
          className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-ink"
        >
          {playing === value ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
        </button>
      </div>
    </Row>
  );

  return (
    <Section title="صوت الأذان">
      <div className="divide-y divide-line">
        {voiceSelect({ label: "أذان الصلوات", value: s.voice, onChange: (v) => s.set({ voice: v }) })}
        {voiceSelect({ label: "أذان الفجر", value: s.fajrVoice, onChange: (v) => s.set({ fajrVoice: v }) })}
        <Row label="مستوى الصوت">
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={s.volume}
            onChange={(e) => s.set({ volume: Number(e.target.value) })}
            aria-label="مستوى الصوت"
            className="w-36 accent-[var(--accent)]"
          />
        </Row>
      </div>

      <div className="mt-4 border-t border-line pt-4">
        <p className="mb-3 text-sm text-muted">أضف أذان مؤذّنك المفضّل من ملف على جهازك. يُحفظ داخل التطبيق ويعمل دون اتصال.</p>
        <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={(e) => void upload(e.target.files?.[0])} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 rounded-full border border-line px-4 py-2 hover:bg-surface"
        >
          <Upload aria-hidden className="size-4" />
          إضافة صوت أذان
        </button>
        {custom.length > 0 && (
          <ul className="mt-3 flex flex-col gap-2">
            {custom.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{v.name}</span>
                <button
                  type="button"
                  aria-label={`حذف ${v.name}`}
                  onClick={async () => {
                    await removeCustomVoice(v.id);
                    if (s.voice === v.id) s.set({ voice: "default" });
                    if (s.fajrVoice === v.id) s.set({ fajrVoice: "default" });
                    refresh();
                  }}
                  className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-fg"
                >
                  <Trash2 aria-hidden className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}
