import meta from "@/data/quran-meta.json";
import { num } from "@/lib/format";

// فهرس مصحف المدينة: بداية كل صفحة (سورة، آية)، وبداية كل جزء، وأسماء السور
export const TOTAL_PAGES = 604;
const PAGES = meta.pages as [number, number][];
const JUZ_PAGES = meta.juzPages as number[];
export const SURAHS = meta.surahs as { n: number; name: string; ayahs: number }[];

export const surahName = (n: number) => SURAHS[n - 1]?.name ?? "";

export function clampPage(p: number) {
  return Math.min(TOTAL_PAGES, Math.max(1, Math.round(p) || 1));
}

export function pageStart(page: number) {
  const [s, a] = PAGES[clampPage(page) - 1];
  return { surah: s, ayah: a };
}

// آخر آية في الصفحة = ما قبل بداية الصفحة التالية
export function pageEnd(page: number) {
  if (page >= TOTAL_PAGES) return { surah: 114, ayah: 6 };
  const next = pageStart(page + 1);
  if (next.ayah > 1) return { surah: next.surah, ayah: next.ayah - 1 };
  const prev = SURAHS[next.surah - 2];
  return { surah: prev.n, ayah: prev.ayahs };
}

export function juzOfPage(page: number) {
  let juz = 1;
  JUZ_PAGES.forEach((p, i) => {
    if (page >= p) juz = i + 1;
  });
  return juz;
}

export function rangeLabel(from: number, to: number) {
  const a = pageStart(from);
  const b = pageEnd(to);
  const start = `${surahName(a.surah)} ${num(a.ayah)}`;
  const end = `${surahName(b.surah)} ${num(b.ayah)}`;
  return a.surah === b.surah ? `سورة ${surahName(a.surah)} من ${num(a.ayah)} إلى ${num(b.ayah)}` : `من ${start} إلى ${end}`;
}

export const KHATMA_PLANS = [
  { days: 7, label: "أسبوع" },
  { days: 10, label: "١٠ أيام" },
  { days: 15, label: "١٥ يومًا" },
  { days: 20, label: "٢٠ يومًا" },
  { days: 30, label: "شهر (جزء يوميًا)" },
  { days: 60, label: "شهران (نصف جزء)" },
  { days: 120, label: "٤ أشهر (ربع جزء)" },
] as const;

export function pagesPerDay(days: number) {
  return Math.ceil(TOTAL_PAGES / days);
}

// آخر صفحة في كل ورد من أوراد الخطة. خطة الشهر تتبع حدود الأجزاء تمامًا، وخطة الشهرين أنصافها
export function wirdEnds(days: number): number[] {
  const juzEnds = [...JUZ_PAGES.slice(1).map((p) => p - 1), TOTAL_PAGES];
  if (days === 30) return juzEnds;
  if (days === 60) {
    const starts = [...JUZ_PAGES, TOTAL_PAGES + 1];
    return juzEnds.flatMap((end, i) => [Math.floor((starts[i] + end) / 2), end]);
  }
  return Array.from({ length: days }, (_, k) => Math.round((TOTAL_PAGES * (k + 1)) / days));
}

// الورد الذي تقع فيه الصفحة: رقمه (من ٠) وآخر صفحة فيه
export function wirdAt(days: number, page: number) {
  const ends = wirdEnds(days);
  const index = ends.findIndex((end) => page <= end);
  return { index, end: ends[index] ?? TOTAL_PAGES };
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  surah: number;
  juz: number;
  sajda: boolean;
}

// النص العثماني من api.alquran.cloud (نص Tanzil). الصفحات المفتوحة تُخزَّن عبر Service Worker للقراءة دون اتصال
export async function fetchPage(page: number, signal?: AbortSignal): Promise<Ayah[]> {
  const res = await fetch(`https://api.alquran.cloud/v1/page/${clampPage(page)}/quran-uthmani`, { signal });
  if (!res.ok) throw new Error(`quran page ${page}: ${res.status}`);
  const json = (await res.json()) as {
    data: {
      ayahs: {
        number: number;
        text: string;
        numberInSurah: number;
        juz: number;
        sajda: boolean | object;
        surah: { number: number };
      }[];
    };
  };
  return json.data.ayahs.map((a) => ({
    number: a.number,
    text: a.text,
    numberInSurah: a.numberInSurah,
    surah: a.surah.number,
    juz: a.juz,
    // الـ API يعيد false أو كائنًا يصف السجدة
    sajda: a.sajda !== false,
  }));
}

// تحميل صفحات ورد اليوم مسبقًا ليُقرأ دون اتصال، بثلاث طلبات متوازية على الأكثر
export async function prefetchPages(from: number, to: number, signal?: AbortSignal) {
  const queue = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  const worker = async () => {
    while (queue.length && !signal?.aborted) {
      const p = queue.shift()!;
      await fetch(`https://api.alquran.cloud/v1/page/${p}/quran-uthmani`, { signal }).catch(() => undefined);
    }
  };
  await Promise.all([worker(), worker(), worker()]);
}

const BASMALA_PLAIN = "بسم الله الرحمن الرحيم";

// المقارنة بعد حذف التشكيل، لأن ترتيب علامات الضبط (الشدة والفتحة) يختلف بين المصادر
const bare = (s: string) => s.replace(/[ً-ٰٟۖ-ۭ]/g, "").replace(/ٱ/g, "ا");

// النص يضع البسملة داخل الآية الأولى من كل سورة (عدا الفاتحة والتوبة)، فنفصلها لعرضها سطرًا مستقلًا
export function splitBasmala(ayah: Ayah) {
  if (ayah.numberInSurah !== 1 || ayah.surah === 1 || ayah.surah === 9) return { basmala: false, text: ayah.text };
  const words = ayah.text.split(" ");
  if (bare(words.slice(0, 4).join(" ")) !== BASMALA_PLAIN) return { basmala: false, text: ayah.text };
  return { basmala: true, text: words.slice(4).join(" ") };
}
