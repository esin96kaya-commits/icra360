"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

export function RolePermissionForm({
  roleId,
  roleName,
  selected,
  permissions,
}: {
  roleId: string;
  roleName: string;
  selected: string[];
  permissions: string[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(formData: FormData) {
    const permissionCodes = formData.getAll("permission").map(String);
    const response = await fetch(`/api/v1/roles/${roleId}/permissions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissionCodes }),
    });
    const body = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(body.message ?? "İzinler güncellenemedi.");
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardTitle>{roleName}</CardTitle>
      <form action={onSubmit} className="mt-3 space-y-3">
        <div className="grid max-h-64 gap-2 overflow-auto sm:grid-cols-2">
          {permissions.map((code) => (
            <label key={code} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="permission" value={code} defaultChecked={selected.includes(code)} />
              {code}
            </label>
          ))}
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" size="sm">
          Kaydet
        </Button>
      </form>
    </Card>
  );
}
