import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DhikrReader } from "@/components/dhikr-reader";
import { CATEGORIES, getCategory } from "@/lib/adhkar";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ id: String(c.id) }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const cat = getCategory(Number(id));
  return { title: cat ? `${cat.category} · مِحراب` : "مِحراب" };
}

export default async function DhikrCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cat = getCategory(Number(id));
  if (!cat) notFound();
  return <DhikrReader categoryId={cat.id} />;
}
