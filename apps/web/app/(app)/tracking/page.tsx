import { LegalNote } from "@/components/legal-note";
import { TrackingList } from "@/components/tracking-list";
import { requirePageContext } from "@/lib/context";

export default async function TrackingPage() {
  await requirePageContext();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">İcra takip</h1>
        <p className="mt-1 text-sm leading-6 text-navy/70">Dosya, sıra, kalan borç ve cevap süresi aynı listede.</p>
      </div>
      <TrackingList />
      <LegalNote>Sıra ve kesinti tutarları öneridir. Kilit, yetkili doğrulamasından sonra oluşur.</LegalNote>
    </div>
  );
}
