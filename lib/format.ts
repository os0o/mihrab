// تنسيق عربي موحّد بالأرقام العربية المشرقية
const numFmt = new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 });

export function num(n: number) {
  return numFmt.format(n);
}

const pad = (n: number) => numFmt.format(n).padStart(2, "٠");

export function clock(date: Date, hour12: boolean) {
  const h24 = date.getHours();
  const m = pad(date.getMinutes());
  if (!hour12) return `${pad(h24)}:${m}`;
  const h = h24 % 12 || 12;
  return `${num(h)}:${m}`;
}

export function meridiem(date: Date) {
  return date.getHours() < 12 ? "ص" : "م";
}

// عدّاد تنازلي س:د:ث
export function countdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  // دون الساعة نعرض الدقائق والثواني فقط
  return h > 0 ? `${num(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

// صياغة قراءة واضحة لقارئ الشاشة بدل الأرقام المتلاصقة
export function countdownSpoken(ms: number) {
  const total = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${num(m)} دقيقة`;
  return `${num(h)} ساعة و${num(m)} دقيقة`;
}

const dayFmt = new Intl.DateTimeFormat("ar-SA-u-ca-gregory", { weekday: "long", day: "numeric", month: "long" });
const shortDayFmt = new Intl.DateTimeFormat("ar-SA-u-ca-gregory", { weekday: "short", day: "numeric", month: "short" });

export function gregorianLabel(date: Date) {
  return dayFmt.format(date);
}

export function shortDay(date: Date) {
  return shortDayFmt.format(date);
}

export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}
