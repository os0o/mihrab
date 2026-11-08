// التاريخ الهجري من تقويم أم القرى المدمج في المتصفح (قد يختلف يومًا عن الرؤية المحلية)
const partsFmt = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
});

const labelFmt = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function hijriParts(date: Date) {
  const parts = partsFmt.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { day: get("day"), month: get("month"), year: get("year") };
}

export function hijriLabel(date: Date) {
  return labelFmt.format(date);
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0); // الظهر يتجنب مشاكل التوقيت الصيفي عند منتصف الليل
  return d;
}

export interface RamadanInfo {
  inRamadan: boolean;
  start: Date;
  days: number;
  // رقم يوم رمضان الحالي، أو 0 خارج رمضان
  today: number;
}

// يجد رمضان الحالي أو القادم بالبحث يومًا بيوم (أقل من 400 خطوة)
export function findRamadan(now: Date): RamadanInfo {
  const today = startOfDay(now);
  const cur = hijriParts(today);
  let start: Date;
  if (cur.month === 9) {
    start = new Date(today);
    start.setDate(start.getDate() - (cur.day - 1));
  } else {
    start = new Date(today);
    for (let i = 0; i < 400; i++) {
      start.setDate(start.getDate() + 1);
      const p = hijriParts(start);
      if (p.month === 9 && p.day === 1) break;
    }
  }
  let days = 29;
  const probe = new Date(start);
  probe.setDate(probe.getDate() + 29);
  if (hijriParts(probe).month === 9) days = 30;

  return { inRamadan: cur.month === 9, start, days, today: cur.month === 9 ? cur.day : 0 };
}
