export interface City {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

// مدن رئيسية لاختيار الموقع دون GPS
export const CITIES: City[] = [
  { name: "مكة المكرمة", country: "السعودية", latitude: 21.4225, longitude: 39.8262 },
  { name: "المدينة المنورة", country: "السعودية", latitude: 24.4672, longitude: 39.6111 },
  { name: "الرياض", country: "السعودية", latitude: 24.7136, longitude: 46.6753 },
  { name: "جدة", country: "السعودية", latitude: 21.4858, longitude: 39.1925 },
  { name: "الدمام", country: "السعودية", latitude: 26.4207, longitude: 50.0888 },
  { name: "الطائف", country: "السعودية", latitude: 21.2703, longitude: 40.4158 },
  { name: "تبوك", country: "السعودية", latitude: 28.3835, longitude: 36.5662 },
  { name: "أبها", country: "السعودية", latitude: 18.2164, longitude: 42.5053 },
  { name: "بريدة", country: "السعودية", latitude: 26.326, longitude: 43.975 },
  { name: "حائل", country: "السعودية", latitude: 27.5114, longitude: 41.7208 },
  { name: "جازان", country: "السعودية", latitude: 16.8892, longitude: 42.5511 },
  { name: "دبي", country: "الإمارات", latitude: 25.2048, longitude: 55.2708 },
  { name: "أبوظبي", country: "الإمارات", latitude: 24.4539, longitude: 54.3773 },
  { name: "الدوحة", country: "قطر", latitude: 25.2854, longitude: 51.531 },
  { name: "الكويت", country: "الكويت", latitude: 29.3759, longitude: 47.9774 },
  { name: "المنامة", country: "البحرين", latitude: 26.2285, longitude: 50.586 },
  { name: "مسقط", country: "عُمان", latitude: 23.588, longitude: 58.3829 },
  { name: "صنعاء", country: "اليمن", latitude: 15.3694, longitude: 44.191 },
  { name: "عمّان", country: "الأردن", latitude: 31.9454, longitude: 35.9284 },
  { name: "القدس", country: "فلسطين", latitude: 31.7683, longitude: 35.2137 },
  { name: "دمشق", country: "سوريا", latitude: 33.5138, longitude: 36.2765 },
  { name: "بيروت", country: "لبنان", latitude: 33.8938, longitude: 35.5018 },
  { name: "بغداد", country: "العراق", latitude: 33.3152, longitude: 44.3661 },
  { name: "القاهرة", country: "مصر", latitude: 30.0444, longitude: 31.2357 },
  { name: "الإسكندرية", country: "مصر", latitude: 31.2001, longitude: 29.9187 },
  { name: "الخرطوم", country: "السودان", latitude: 15.5007, longitude: 32.5599 },
  { name: "طرابلس", country: "ليبيا", latitude: 32.8872, longitude: 13.1913 },
  { name: "تونس", country: "تونس", latitude: 36.8065, longitude: 10.1815 },
  { name: "الجزائر", country: "الجزائر", latitude: 36.7538, longitude: 3.0588 },
  { name: "الدار البيضاء", country: "المغرب", latitude: 33.5731, longitude: -7.5898 },
  { name: "الرباط", country: "المغرب", latitude: 34.0209, longitude: -6.8416 },
  { name: "نواكشوط", country: "موريتانيا", latitude: 18.0735, longitude: -15.9582 },
  { name: "إسطنبول", country: "تركيا", latitude: 41.0082, longitude: 28.9784 },
  { name: "كراتشي", country: "باكستان", latitude: 24.8607, longitude: 67.0011 },
  { name: "جاكرتا", country: "إندونيسيا", latitude: -6.2088, longitude: 106.8456 },
  { name: "كوالالمبور", country: "ماليزيا", latitude: 3.139, longitude: 101.6869 },
  { name: "لندن", country: "بريطانيا", latitude: 51.5074, longitude: -0.1278 },
  { name: "باريس", country: "فرنسا", latitude: 48.8566, longitude: 2.3522 },
  { name: "برلين", country: "ألمانيا", latitude: 52.52, longitude: 13.405 },
  { name: "نيويورك", country: "الولايات المتحدة", latitude: 40.7128, longitude: -74.006 },
  { name: "تورونتو", country: "كندا", latitude: 43.6532, longitude: -79.3832 },
];
