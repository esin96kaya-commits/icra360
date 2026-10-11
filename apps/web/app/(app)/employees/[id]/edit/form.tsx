"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EmployeeEditForm({
  employee,
}: {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string | null;
    version: number;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(formData: FormData) {
    const response = await fetch(`/api/v1/employees/${employee.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: String(formData.get("firstName") ?? ""),
        lastName: String(formData.get("lastName") ?? ""),
        employeeNumber: String(formData.get("employeeNumber") ?? "") || null,
        version: employee.version,
      }),
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(body.message ?? "Güncellenemedi.");
      return;
    }
    router.push(`/employees/${employee.id}`);
    router.refresh();
  }

  return (
    <form action={onSubmit} className="space-y-4 rounded-lg border border-stone-200 bg-white p-5">
      <div>
        <Label htmlFor="firstName">Ad</Label>
        <Input id="firstName" name="firstName" defaultValue={employee.firstName} required />
      </div>
      <div>
        <Label htmlFor="lastName">Soyad</Label>
        <Input id="lastName" name="lastName" defaultValue={employee.lastName} required />
      </div>
      <div>
        <Label htmlFor="employeeNumber">Sicil no</Label>
        <Input id="employeeNumber" name="employeeNumber" defaultValue={employee.employeeNumber ?? ""} />
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button type="submit">Kaydet</Button>
    </form>
  );
}
