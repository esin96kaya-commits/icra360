import Link from "next/link";
import { notFound } from "next/navigation";
import { CASE_STATUS_LABEL, CASE_STATUS_TONE, getWorkCase, templateSuggestionsFor } from "@/lib/workbench";
import { LegalNote } from "@/components/legal-note";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { requirePageContext } from "@/lib/context";
import { formatDateTR, formatMoneyTR } from "@/lib/utils";

export default async function TrackingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePageContext();
  const { id } = await params;
  const workCase = getWorkCase(id);
  if (!workCase) {
    notFound();
  }
  const suggestion = templateSuggestionsFor(workCase)[0];

  return (
    <div className="space-y-5">
      <div>
        <Link href="/tracking" className="text-sm font-medium text-teal">
          ← İcra takip
        </Link>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{workCase.employeeName}</h1>
            <p className="mt-1 font-mono text-xs text-navy/50">{workCase.maskedNationalId}</p>
          </div>
          <StatusPill tone={CASE_STATUS_TONE[workCase.status]}>{CASE_STATUS_LABEL[workCase.status]}</StatusPill>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-navy">Dosya</h2>
        <dl className="mt-3 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-navy/50">Şirket</dt>
            <dd className="max-w-[60%] text-right text-navy">{workCase.company}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-navy/50">İşyeri</dt>
            <dd className="text-right text-navy">{workCase.workplace}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-navy/50">İcra dairesi</dt>
            <dd className="max-w-[60%] text-right text-navy">{workCase.office}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-navy/50">Esas no</dt>
            <dd className="text-right text-navy">{workCase.fileNo}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-navy/50">Tebligat</dt>
            <dd className="text-right text-navy">{workCase.noticeType}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-navy/50">Alacaklı</dt>
            <dd className="text-right text-navy">{workCase.creditor}</dd>
          </div>
        </dl>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-[11px] uppercase tracking-wide text-navy/45">Sıra</p>
          <p className="mt-2 text-2xl font-semibold text-navy">{workCase.queue}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-[11px] uppercase tracking-wide text-navy/45">Cevap sonu</p>
          <p className="mt-2 text-base font-semibold text-navy">{formatDateTR(workCase.dueDate)}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-[11px] uppercase tracking-wide text-navy/45">Kesilen</p>
          <p className="mt-2 text-base font-semibold text-navy">{formatMoneyTR(workCase.deducted)}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-[11px] uppercase tracking-wide text-navy/45">Kalan</p>
          <p className="mt-2 text-base font-semibold text-navy">{formatMoneyTR(workCase.remaining)}</p>
        </div>
      </section>

      {suggestion ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-teal">Şablon önerisi</p>
          <p className="mt-2 font-medium text-navy">{suggestion.title}</p>
          <p className="mt-1 text-sm leading-6 text-navy/65">{suggestion.reason}</p>
          <Button asChild className="mt-4 h-12 w-full rounded-xl">
            <Link href="/replies/compose">Cevap yazısı yaz</Link>
          </Button>
        </section>
      ) : null}
      <LegalNote />
    </div>
  );
}
