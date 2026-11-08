import { Suspense } from "react";
import { QuranReader } from "@/components/quran-reader";

export const metadata = { title: "القراءة · مِحراب" };

// رقم الصفحة في ?p= لأن التصدير الثابت لا يولّد ٦٠٤ صفحة منفصلة بلا داعٍ
export default function ReadPage() {
  return (
    <Suspense fallback={<div aria-busy className="mt-10 h-96 animate-pulse rounded-3xl bg-surface" />}>
      <QuranReader />
    </Suspense>
  );
}
