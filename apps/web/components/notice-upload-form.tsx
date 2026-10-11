"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CompanyOption = { id: string; legalName: string };

export function NoticeUploadForm({ companies }: { companies: CompanyOption[] }) {
  const [fileName, setFileName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="font-semibold text-navy">Belge alındı, işlem durdu.</p>
        <p className="mt-2 text-sm leading-6 text-navy/70">
          OCR ve alan çıkarımı sizin doğrulamanız olmadan dosyaya yazılmaz. Eşleştirme ve cevap yazısı sonraki adımlardır;
          otomatik gönderim yoktur.
        </p>
        <Button type="button" className="mt-5 h-12 w-full rounded-xl" onClick={() => setSubmitted(false)}>
          Yeni tebligat
        </Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="company">Şirket</Label>
        <select
          id="company"
          name="company"
          required
          className="flex h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-ink"
        >
          <option value="">Tüzel kişiliği seçin</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.legalName}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="receivedAt">İşyerine ulaşma tarihi</Label>
        <Input id="receivedAt" name="receivedAt" type="date" required className="h-12 rounded-xl" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="file">Tebligat dosyası</Label>
        <label
          htmlFor="file"
          className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-4 text-center"
        >
          <span className="text-sm font-medium text-navy">{fileName || "PDF, JPG veya PNG seçin"}</span>
          <span className="mt-1 text-xs text-navy/55">En fazla 20 MB. Virüs tarama sonraki fazdadır.</span>
        </label>
        <input
          id="file"
          name="file"
          type="file"
          required
          accept=".pdf,.png,.jpg,.jpeg"
          className="sr-only"
          onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="note">Not (isteğe bağlı)</Label>
        <textarea
          id="note"
          name="note"
          rows={3}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base text-ink"
          placeholder="Teslim alan, evrak no…"
        />
      </div>
      <Button type="submit" className="h-12 w-full rounded-xl text-base">
        Yüklemeyi kaydet
      </Button>
    </form>
  );
}
