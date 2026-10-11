import Link from "next/link";
import { REPORTS } from "@/lib/workbench";
import { LegalNote } from "@/components/legal-note";
import { requirePageContext } from "@/lib/context";

export default async function ReportsPage() {
  await requirePageContext();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Raporlar</h1>
        <p className="mt-1 text-sm leading-6 text-navy/70">Özetler maskeli TCKN ile üretilir. Dışa aktarım onay ve audit ister.</p>
      </div>
      <div className="grid gap-3">
        {REPORTS.map((report) => (
          <Link
            key={report.slug}
            href={`/reports/${report.slug}`}
            className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="font-semibold text-navy">{report.title}</p>
            <p className="mt-1 text-sm leading-6 text-navy/65">{report.summary}</p>
          </Link>
        ))}
      </div>
      <LegalNote>Raporlarda tam TCKN ve IBAN gösterilmez.</LegalNote>
    </div>
  );
}
