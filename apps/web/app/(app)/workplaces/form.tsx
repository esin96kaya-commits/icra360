"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WorkplaceCreateForm({ companies }: { companies: Array<{ id: string; legalName: string }> }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(formData: FormData) {
    const response = await fetch("/api/v1/workplaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId: String(formData.get("companyId") ?? ""),
        name: String(formData.get("name") ?? ""),
        sgkNumber: String(formData.get("sgkNumber") ?? "") || undefined,
      }),
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(body.message ?? "İşyeri eklenemedi.");
      return;
    }
    router.refresh();
  }

  return (
    <form action={onSubmit} className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 sm:grid-cols-4">
      <div>
        <Label htmlFor="companyId">Şirket</Label>
        <select id="companyId" name="companyId" className="mt-1 h-10 w-full rounded-md border border-stone-300 px-3 text-sm">
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.legalName}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="name">Ad</Label>
        <Input id="name" name="name" required />
      </div>
      <div>
        <Label htmlFor="sgkNumber">SGK no</Label>
        <Input id="sgkNumber" name="sgkNumber" />
      </div>
      <div className="flex items-end">
        <Button type="submit">Ekle</Button>
      </div>
      {error ? <p className="sm:col-span-4 text-sm text-danger">{error}</p> : null}
    </form>
  );
}
