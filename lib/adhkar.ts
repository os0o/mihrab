import data from "@/data/adhkar.json";

export interface Dhikr {
  id: number;
  text: string;
  count: number;
  fadl?: string;
  source?: string;
}

export interface DhikrCategory {
  id: number;
  category: string;
  items: Dhikr[];
}

export const CATEGORIES = data.categories as DhikrCategory[];
export const ADHKAR_META = data.meta;

export const CATEGORY_IDS = {
  morning: 133,
  evening: 134,
  sleep: 28,
  waking: 1,
  afterPrayer: 25,
  iftar: 68,
} as const;

export function getCategory(id: number) {
  return CATEGORIES.find((c) => c.id === id);
}

export const dhikrKey = (categoryId: number, itemId: number) => `${categoryId}:${itemId}`;

// تطبيع للبحث: حذف التشكيل وتوحيد الهمزات والتاء المربوطة
export function normalizeArabic(s: string) {
  return s
    .replace(/[ً-ٰٟۖ-ۭـ]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ﭐ-﷿ﹰ-﻿]/g, (c) => c.normalize("NFKC"))
    .trim();
}

// الذكر المناسب للوقت الحالي
export function suggestedCategory(period: string) {
  if (period === "fajr" || period === "morning") return CATEGORY_IDS.morning;
  if (period === "asr" || period === "maghrib") return CATEGORY_IDS.evening;
  if (period === "night") return CATEGORY_IDS.sleep;
  return CATEGORY_IDS.afterPrayer;
}
