import type { Coords } from "@/lib/prayer";

// إحداثيات الكعبة المشرفة
export const KAABA: Coords = { latitude: 21.422487, longitude: 39.826206 };

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

// يحصر الزاوية بين 0 و 360
export function normalizeDeg(deg: number) {
  return ((deg % 360) + 360) % 360;
}

// أقصر فرق بين زاويتين بين -180 و 180، الموجب يعني الدوران مع عقارب الساعة (يمينًا)
export function angleDelta(from: number, to: number) {
  const d = normalizeDeg(to - from);
  return d > 180 ? d - 360 : d;
}

// اتجاه القبلة من الشمال الحقيقي مع عقارب الساعة (الدائرة العظمى)
export function qiblaBearing({ latitude, longitude }: Coords) {
  const φ1 = toRad(latitude);
  const φ2 = toRad(KAABA.latitude);
  const Δλ = toRad(KAABA.longitude - longitude);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return normalizeDeg(toDeg(Math.atan2(y, x)));
}

// المسافة إلى الكعبة بالكيلومتر (Haversine)
export function distanceToKaabaKm({ latitude, longitude }: Coords) {
  const R = 6371;
  const dφ = toRad(KAABA.latitude - latitude);
  const dλ = toRad(KAABA.longitude - longitude);
  const a =
    Math.sin(dφ / 2) ** 2 + Math.cos(toRad(latitude)) * Math.cos(toRad(KAABA.latitude)) * Math.sin(dλ / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const DIRECTIONS = ["الشمال", "الشمال الشرقي", "الشرق", "الجنوب الشرقي", "الجنوب", "الجنوب الغربي", "الغرب", "الشمال الغربي"];

// اسم الاتجاه التقريبي للزاوية (8 اتجاهات)
export function directionName(deg: number) {
  return DIRECTIONS[Math.round(normalizeDeg(deg) / 45) % 8];
}
