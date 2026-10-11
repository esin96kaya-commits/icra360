import { Icra360Logo } from "@/components/brand/logo";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { Card } from "@/components/ui/card";

export default function PreviewPanelPage() {
  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <header
        className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))", paddingBottom: "0.75rem" }}
      >
        <Icra360Logo />
        <p className="text-[11px] text-navy/55">Ayşe Yönetici</p>
      </header>
      <main className="px-4 py-5 pb-24">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-teal">İcra360</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Ana sayfa</h1>
        <p className="mt-1 text-sm leading-6 text-navy/70">Personel icra süreçleri tek yerde.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wide text-navy/55">Şirket</p>
            <p className="mt-2 text-3xl font-semibold text-navy">2</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wide text-navy/55">İşyeri</p>
            <p className="mt-2 text-3xl font-semibold text-navy">2</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wide text-navy/55">Personel</p>
            <p className="mt-2 text-3xl font-semibold text-navy">3</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wide text-navy/55">Kullanıcı</p>
            <p className="mt-2 text-3xl font-semibold text-navy">4</p>
          </Card>
        </div>
      </main>
      <MobileTabBar
        items={[
          { href: "/preview", label: "Ana sayfa", icon: "home" },
          { href: "/preview", label: "Tebligat yükle", icon: "upload" },
          { href: "/preview", label: "Cevap yazısı yaz", icon: "compose" },
          { href: "/preview", label: "İcra takip", icon: "tracking" },
          { href: "/preview", label: "Raporlar", icon: "reports" },
        ]}
      />
    </div>
  );
}
