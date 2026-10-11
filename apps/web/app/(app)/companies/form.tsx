"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CompanyCreateForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(formData: FormData) {
    const response = await fetch("/api/v1/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        legalName: String(formData.get("legalName") ?? ""),
        taxNumber: String(formData.get("taxNumber") ?? ""),
        taxOffice: String(formData.get("taxOffice") ?? "") || undefined,
      }),
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(body.message ?? "Şirket eklenemedi.");
      return;
    }
    router.refresh();
  }

  return (
    <form action={onSubmit} className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 sm:grid-cols-4">
      <div className="sm:col-span-2">
        <Label htmlFor="legalName">Unvan</Label>
        <Input id="legalName" name="legalName" required />
      </div>
      <div>
        <Label htmlFor="taxNumber">Vergi no</Label>
        <Input id="taxNumber" name="taxNumber" required />
      </div>
      <div className="flex items-end">
        <Button type="submit">Ekle</Button>
      </div>
      {error ? <p className="sm:col-span-4 text-sm text-danger">{error}</p> : null}
    </form>
  );
}
