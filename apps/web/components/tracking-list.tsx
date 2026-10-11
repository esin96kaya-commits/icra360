"use client";

import { useMemo, useState } from "react";
import { WORK_CASES, type CaseStatus } from "@/lib/workbench";
import { CaseCard } from "@/components/case-card";
import { Input } from "@/components/ui/input";

const FILTERS: Array<{ id: "all" | CaseStatus; label: string }> = [
  { id: "all", label: "Tümü" },
  { id: "VERIFYING", label: "Doğrulama" },
  { id: "RESPONSE", label: "Cevap" },
  { id: "DEDUCTING", label: "Kesinti" },
  { id: "QUEUED", label: "Sırada" },
  { id: "TERMINATED_OPEN", label: "Ayrılmış" },
];

export function TrackingList() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  const items = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr-TR");
    return WORK_CASES.filter((item) => {
      if (filter !== "all" && item.status !== filter) {
        return false;
      }
      if (!q) {
        return true;
      }
      return `${item.employeeName} ${item.fileNo} ${item.company}`.toLocaleLowerCase("tr-TR").includes(q);
    });
  }, [filter, query]);

  return (
    <div className="space-y-4">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Ad, dosya no veya şirket"
        className="h-12 rounded-xl"
      />
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={
              filter === item.id
                ? "shrink-0 rounded-full bg-navy px-3 py-1.5 text-xs font-medium text-white"
                : "shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-navy/70 ring-1 ring-slate-200"
            }
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <CaseCard key={item.id} workCase={item} />
        ))}
        {items.length === 0 ? <p className="px-1 text-sm text-navy/55">Bu süzgeçte dosya yok.</p> : null}
      </div>
    </div>
  );
}
