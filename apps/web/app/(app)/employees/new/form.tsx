"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CompanyOption = { id: string; legalName: string };
type WorkplaceOption = { id: string; name: string; companyId: string };

export function EmployeeCreateForm({
  companies,
  workplaces,
}: {
  companies: CompanyOption[];
  workplaces: WorkplaceOption[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? "");

  async function onSubmit(formData: FormData) {
    setError("");
    const payload = {
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      nationalId: String(formData.get("nationalId") ?? ""),
      employeeNumber: String(formData.get("employeeNumber") ?? "") || undefined,
      employment: {
        companyId: String(formData.get("companyId") ?? ""),
        workplaceId: String(formData.get("workplaceId") ?? "") || undefined,
        jobTitle: String(formData.get("jobTitle") ?? "") || undefined,
        status: String(formData.get("status") ?? "ACTIVE"),
        startDate: String(formData.get("startDate") ?? ""),
        endDate: String(formData.get("endDate") ?? "") || undefined,
        netSalary: String(formData.get("netSalary") ?? "") || undefined,
        currency: "TRY",
      },
    };
    const response = await fetch("/api/v1/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as { id?: string; message?: string };
    if (!response.ok) {
      setError(body.message ?? "Kayıt oluşturulamadı.");
      return;
    }
    router.push(`/employees/${body.id}`);
    router.refresh();
  }

  return (
    <form action={onSubmit} className="space-y-4 rounded-lg border border-stone-200 bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">Ad</Label>
          <Input id="firstName" name="firstName" required />
        </div>
        <div>
          <Label htmlFor="lastName">Soyad</Label>
          <Input id="lastName" name="lastName" required />
        </div>
        <div>
          <Label htmlFor="nationalId">T.C. kimlik no</Label>
          <Input id="nationalId" name="nationalId" required inputMode="numeric" />
        </div>
        <div>
          <Label htmlFor="employeeNumber">Sicil no</Label>
          <Input id="employeeNumber" name="employeeNumber" />
        </div>
        <div>
          <Label htmlFor="companyId">Şirket</Label>
          <select
            id="companyId"
            name="companyId"
            className="mt-1 h-10 w-full rounded-md border border-stone-300 px-3 text-sm"
            value={companyId}
            onChange={(event) => setCompanyId(event.target.value)}
          >
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.legalName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="workplaceId">İşyeri</Label>
          <select
            id="workplaceId"
            name="workplaceId"
            className="mt-1 h-10 w-full rounded-md border border-stone-300 px-3 text-sm"
          >
            <option value="">—</option>
            {workplaces
              .filter((workplace) => workplace.companyId === companyId)
              .map((workplace) => (
                <option key={workplace.id} value={workplace.id}>
                  {workplace.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <Label htmlFor="jobTitle">Unvan</Label>
          <Input id="jobTitle" name="jobTitle" />
        </div>
        <div>
          <Label htmlFor="status">Durum</Label>
          <select id="status" name="status" className="mt-1 h-10 w-full rounded-md border border-stone-300 px-3 text-sm">
            <option value="ACTIVE">Aktif</option>
            <option value="TERMINATED">İşten ayrılmış</option>
          </select>
        </div>
        <div>
          <Label htmlFor="startDate">İşe giriş</Label>
          <Input id="startDate" name="startDate" type="date" required />
        </div>
        <div>
          <Label htmlFor="endDate">İşten çıkış</Label>
          <Input id="endDate" name="endDate" type="date" />
        </div>
        <div>
          <Label htmlFor="netSalary">Net ücret (örn. 32000.00)</Label>
          <Input id="netSalary" name="netSalary" />
        </div>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button type="submit">Kaydet</Button>
    </form>
  );
}
