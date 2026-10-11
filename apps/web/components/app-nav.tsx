"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type AppNavItem = {
  href: string;
  label: string;
  match?: string;
};

export function AppNav({ items }: { items: AppNavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Ana menü">
      {items.map((item) => {
        const root = item.match ?? item.href;
        const active =
          item.href === "/dashboard" ? pathname === "/dashboard" : pathname === item.href || pathname.startsWith(`${root}/`) || pathname.startsWith(root);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-lg px-3 py-2.5 text-sm",
              active ? "bg-white/12 font-medium text-white" : "text-white/80 hover:bg-white/8",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
