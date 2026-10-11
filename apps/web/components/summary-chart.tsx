import { SUMMARY_METRICS, type SummaryCounts } from "@/lib/workbench";

export function SummaryChart({
  title,
  period,
  counts,
}: {
  title: string;
  period: string;
  counts: SummaryCounts;
}) {
  const values = SUMMARY_METRICS.map((metric) => counts[metric.key]);
  const max = Math.max(...values, 1);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-navy">{title}</h2>
        <p className="text-xs text-navy/50">{period}</p>
      </div>
      <div className="mt-3 flex h-28 items-end gap-2">
        {SUMMARY_METRICS.map((metric) => {
          const value = counts[metric.key];
          const height = Math.max(6, Math.round((value / max) * 88));
          return (
            <div key={metric.key} className="flex min-w-0 flex-1 flex-col items-center">
              <p className="mb-1 text-[11px] font-semibold text-navy">{value}</p>
              <div
                className="w-full max-w-9 rounded-t-md"
                style={{ height, backgroundColor: metric.color }}
                title={`${metric.label}: ${value}`}
              />
            </div>
          );
        })}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {SUMMARY_METRICS.map((metric) => (
          <li key={metric.key} className="flex min-w-0 items-center justify-between gap-2 text-[11px]">
            <span className="flex min-w-0 items-center gap-1.5 text-navy/80">
              <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: metric.color }} />
              <span className="truncate">{metric.label}</span>
            </span>
            <span className="shrink-0 font-semibold text-navy">{counts[metric.key]}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
