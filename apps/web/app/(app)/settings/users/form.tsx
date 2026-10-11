"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UserCreateForm({
  roles,
  companies,
}: {
  roles: Array<{ code: string; name: string }>;
  companies: Array<{ id: string; legalName: string }>;
}) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(formData: FormData) {
    const response = await fetch("/api/v1/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        roleCode: String(formData.get("roleCode") ?? ""),
        companyId: String(formData.get("companyId") ?? "") || undefined,
      }),
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(body.message ?? "Kullanıcı eklenemedi.");
      return;
    }
    router.refresh();
  }

  return (
    <form action={onSubmit} className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 md:grid-cols-5">
      <div>
        <Label htmlFor="name">Ad</Label>
        <Input id="name" name="name" required />
      </div>
      <div>
        <Label htmlFor="email">E-posta</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="password">Parola</Label>
        <Input id="password" name="password" type="password" minLength={10} required />
      </div>
      <div>
        <Label htmlFor="roleCode">Rol</Label>
        <select id="roleCode" name="roleCode" className="mt-1 h-10 w-full rounded-md border border-stone-300 px-3 text-sm">
          {roles.map((role) => (
            <option key={role.code} value={role.code}>
              {role.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="companyId">Şirket kapsamı</Label>
        <select id="companyId" name="companyId" className="mt-1 h-10 w-full rounded-md border border-stone-300 px-3 text-sm">
          <option value="">Tümü (yalnızca sistem yöneticisi)</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.legalName}
            </option>
          ))}
        </select>
      </div>
      <div className="md:col-span-5">
        <Button type="submit">Davet et / oluştur</Button>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      </div>
    </form>
  );
}
