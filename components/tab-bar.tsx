"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, BookOpenText, CircleDotDashed, Compass, MoonStar, SunMoon, type LucideIcon } from "lucide-react";

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "اليوم", icon: SunMoon },
  { href: "/quran", label: "القرآن", icon: BookOpen },
  { href: "/qibla", label: "القبلة", icon: Compass },
  { href: "/adhkar", label: "الأذكار", icon: BookOpenText },
  { href: "/tasbih", label: "السبحة", icon: CircleDotDashed },
  { href: "/ramadan", label: "رمضان", icon: MoonStar },
];

function isActive(pathname: string, href: string) {
  const path = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  return href === "/" ? path === "/" || path === "/settings" : path === href || path.startsWith(`${href}/`);
}

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between rounded-[1.75rem] border border-line bg-base/80 p-1.5 shadow-[0_8px_30px_rgb(0_0_0/0.18)] backdrop-blur-xl">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-3xl text-[10.5px] font-medium transition-colors duration-200 ${
                  active ? "bg-accent text-accent-ink" : "text-muted hover:text-fg"
                }`}
              >
                <Icon aria-hidden className="size-5" strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
