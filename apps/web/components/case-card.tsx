import Link from "next/link";
import { CASE_STATUS_LABEL, CASE_STATUS_TONE, type WorkCase } from "@/lib/workbench";
import { formatDateTR, formatMoneyTR } from "@/lib/utils";
import { StatusPill } from "@/components/status-pill";

export function CaseCard({ workCase }: { workCase: WorkCase }) {
  return (
    <Link href={`/tracking/${workCase.id}`} className="block">
      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-navy">{workCase.employeeName}</p>
            <p className="mt-0.5 font-mono text-xs text-navy/50">{workCase.maskedNationalId}</p>
          </div>
          <StatusPill tone={CASE_STATUS_TONE[workCase.status]}>{CASE_STATUS_LABEL[workCase.status]}</StatusPill>
        </div>
        <p className="mt-3 text-sm text-navy/75">{workCase.company}</p>
        <p className="mt-1 text-xs text-navy/50">
          {workCase.fileNo} · {workCase.office}
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div>
            <dt className="text-navy/45">Sıra</dt>
            <dd className="mt-0.5 font-medium text-navy">{workCase.queue}. sıra</dd>
          </div>
          <div>
            <dt className="text-navy/45">Kalan borç</dt>
            <dd className="mt-0.5 font-medium text-navy">{formatMoneyTR(workCase.remaining)}</dd>
          </div>
          <div>
            <dt className="text-navy/45">Cevap sonu</dt>
            <dd className="mt-0.5 font-medium text-navy">{formatDateTR(workCase.dueDate)}</dd>
          </div>
          <div>
            <dt className="text-navy/45">Sicil</dt>
            <dd className="mt-0.5 font-medium text-navy">{workCase.employeeNumber}</dd>
          </div>
        </dl>
      </article>
    </Link>
  );
}
