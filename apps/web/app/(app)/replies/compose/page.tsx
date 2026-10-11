import { LegalNote } from "@/components/legal-note";
import { ReplyWorkbench } from "@/components/reply-workbench";
import { requirePageContext } from "@/lib/context";

export default async function ReplyComposePage() {
  await requirePageContext();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cevap yazısı yaz</h1>
        <p className="mt-1 text-sm leading-6 text-navy/70">
          En fazla üç şablon önerilir. Metni yapay zekâ yazmaz; onaylı şablon sizin seçiminizle doldurulur.
        </p>
      </div>
      <ReplyWorkbench />
      <LegalNote />
    </div>
  );
}
