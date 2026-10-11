import Link from "next/link";
import { notFound } from "next/navigation";
import { REPORTS, WORK_CASES } from "@/lib/workbench";
import { LegalNote } from "@/components/legal-note";
import { requirePageContext } from "@/lib/context";
import { formatMoneyTR } from "@/lib/utils";

export default async function ReportDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  await requirePageContext();
  const { slug } = await params;
  const report = REPORTS.find((item) => item.slug === slug);
  if (!report) {
    notFound();
  }

  const rows = WORK_CASES.map((item) => ({
    name: item.employeeName,
    fileNo: item.fileNo,
    remaining: item.remaining,
    status: item.status,
  }));

  return (
    <div className="space-y-5">
      <div>
        <Link href="/reports" className="text-sm font-medium text-teal">
          ← Raporlar
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{report.title}</h1>
        <p className="mt-1 text-sm leading-6 text-navy/70">{report.summary}</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas text-xs uppercase tracking-wide text-navy/50">
            <tr>
              <th className="px-4 py-3 font-medium">Personel</th>
              <th className="px-4 py-3 font-medium">Dosya</th>
              <th className="px-4 py-3 font-medium">Kalan</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.fileNo} className="border-t border-slate-100">
                <td className="px-4 py-3 text-navy">{row.name}</td>
                <td className="px-4 py-3 text-navy/70">{row.fileNo}</td>
                <td className="px-4 py-3 text-navy">{formatMoneyTR(row.remaining)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-navy/50">XLSX / PDF dışa aktarım sonraki fazdadır.</p>
      <LegalNote />
    </div>
  );
}
