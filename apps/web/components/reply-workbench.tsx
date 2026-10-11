"use client";

import { useState } from "react";
import { WORK_CASES, templateSuggestionsFor } from "@/lib/workbench";
import { LegalNote } from "@/components/legal-note";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ReplyWorkbench() {
  const pending = WORK_CASES.filter((item) => item.status === "RESPONSE" || item.status === "TERMINATED_OPEN");
  const [caseId, setCaseId] = useState(pending[0]?.id ?? "");
  const [templateCode, setTemplateCode] = useState<string>("");
  const selected = pending.find((item) => item.id === caseId);
  const suggestions = selected ? templateSuggestionsFor(selected) : [];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {pending.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setCaseId(item.id);
              setTemplateCode("");
            }}
            className={cn(
              "w-full rounded-2xl border p-4 text-left",
              caseId === item.id ? "border-teal bg-white shadow-sm" : "border-slate-200 bg-white",
            )}
          >
            <p className="font-semibold text-navy">{item.employeeName}</p>
            <p className="mt-1 text-xs text-navy/55">
              {item.fileNo} · {item.company}
            </p>
          </button>
        ))}
      </div>

      {selected ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-navy">Önerilen şablonlar</p>
          {suggestions.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => setTemplateCode(item.code)}
              className={cn(
                "w-full rounded-2xl border p-4 text-left",
                templateCode === item.code ? "border-navy bg-navy text-white" : "border-slate-200 bg-white",
              )}
            >
              <p className="font-semibold">{item.title}</p>
              <p className={cn("mt-1 text-xs leading-5", templateCode === item.code ? "text-white/75" : "text-navy/60")}>
                {item.reason}
              </p>
            </button>
          ))}
          <LegalNote />
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium text-navy">Doldurulacak alanlar</p>
            <ul className="mt-2 space-y-1 text-sm text-navy/70">
              <li>Şirket: {selected.company}</li>
              <li>Dosya no: {selected.fileNo}</li>
              <li>Personel: {selected.employeeName}</li>
              <li>TCKN: {selected.maskedNationalId}</li>
            </ul>
            <p className="mt-3 text-xs leading-5 text-navy/50">
              Metin üretilmez. Onaylı DOCX şablonu bu alanlarla doldurulur; gönderim ayrı onaya bağlıdır.
            </p>
          </div>
          <Button type="button" className="h-12 w-full rounded-xl text-base" disabled={!templateCode}>
            {templateCode ? "Şablonu onayla ve doldur" : "Önce şablon seçin"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
