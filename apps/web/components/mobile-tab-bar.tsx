"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FilePenLine, House, ListChecks, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const icons = {
  home: House,
  upload: Upload,
  compose: FilePenLine,
  tracking: ListChecks,
  reports: BarChart3,
} as const;

export type MobileTab = {
  href: string;
  label: string;
  icon: keyof typeof icons;
  match?: string;
};

function isTabActive(pathname: string, tab: MobileTab): boolean {
  if (tab.href === "/dashboard" || tab.match === "/dashboard") {
    return pathname === "/dashboard";
  }
  const root = tab.match ?? tab.href;
  return pathname === tab.href || pathname === root || pathname.startsWith(`${root}/`);
}

export function MobileTabBar({ items }: { items: MobileTab[] }) {
  const pathname = usePathname();
  const columns =
    items.length >= 5 ? "grid-cols-5" : items.length === 4 ? "grid-cols-4" : items.length === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      aria-label="Mobil menü"
    >
      <ul className={cn("grid", columns)}>
        {items.map((tab) => {
          const active = isTabActive(pathname, tab);
          const Icon = icons[tab.icon];
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 px-0.5 py-2 text-center text-[10px] font-medium leading-tight",
                  active ? "text-teal" : "text-navy/55",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.4 : 1.8} />
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
