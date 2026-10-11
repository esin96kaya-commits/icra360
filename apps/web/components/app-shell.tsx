import type { ReactNode } from "react";
import { signOut } from "@/auth";
import { hasPermission, type TenantContext } from "@icra360/domain";
import { AppNav } from "@/components/app-nav";
import { Icra360Logo } from "@/components/brand/logo";
import { BRAND } from "@/lib/brand";
import { MobileTabBar, type MobileTab } from "@/components/mobile-tab-bar";

const links = [
  { href: "/dashboard", label: "Ana sayfa", permission: null, match: "/dashboard" },
  { href: "/notices/upload", label: "Tebligat yükle", permission: "notice:upload" as const, match: "/notices" },
  { href: "/replies/compose", label: "Cevap yazısı yaz", permission: "response:create" as const, match: "/replies" },
  { href: "/tracking", label: "İcra takip", permission: "case:read" as const, match: "/tracking" },
  { href: "/reports", label: "Raporlar", permission: "report:read" as const, match: "/reports" },
];

const mobileTabs: MobileTab[] = [
  { href: "/dashboard", label: "Ana sayfa", icon: "home", match: "/dashboard" },
  { href: "/notices/upload", label: "Tebligat yükle", icon: "upload", match: "/notices" },
  { href: "/replies/compose", label: "Cevap yazısı yaz", icon: "compose", match: "/replies" },
  { href: "/tracking", label: "İcra takip", icon: "tracking", match: "/tracking" },
  { href: "/reports", label: "Raporlar", icon: "reports", match: "/reports" },
];

export function AppShell({ ctx, children }: { ctx: TenantContext; children: ReactNode }) {
  const visibleLinks = links.filter((link) => !link.permission || hasPermission(ctx, link.permission));
  const visibleMobileTabs = mobileTabs.filter((tab) => visibleLinks.some((link) => link.href === tab.href));

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <a
        href="#icerik"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-3 focus:py-2"
      >
        İçeriğe geç
      </a>
      <div className="flex min-h-dvh">
        <aside className="hidden w-64 shrink-0 bg-navy text-white md:flex md:flex-col">
          <div className="border-b border-white/10 px-5 py-5">
            <Icra360Logo tone="dark" />
            <p className="mt-2 text-xs text-white/70">{BRAND.slogan}</p>
          </div>
          <AppNav items={visibleLinks.map(({ href, label, match }) => ({ href, label, match }))} />
          <div className="border-t border-white/10 p-4 text-sm">
            <p className="font-medium">{ctx.name}</p>
            <p className="text-xs text-white/70">{ctx.email}</p>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
              className="mt-3"
            >
              <button type="submit" className="text-xs text-teal underline">
                Çıkış
              </button>
            </form>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className="sticky top-0 z-30 flex items-center justify-between bg-canvas/90 px-4 backdrop-blur md:px-8"
            style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))", paddingBottom: "0.65rem" }}
          >
            <div className="md:hidden">
              <Icra360Logo />
            </div>
            <p className="hidden text-sm text-navy/70 md:block">{BRAND.productName}</p>
            <p className="max-w-[45%] truncate text-right text-[11px] text-navy/50 md:text-xs">{ctx.name}</p>
          </header>
          <main id="icerik" className="flex-1 px-4 pb-28 pt-1 md:px-8 md:pb-8">
            {children}
          </main>
        </div>
      </div>
      <MobileTabBar items={visibleMobileTabs} />
    </div>
  );
}
