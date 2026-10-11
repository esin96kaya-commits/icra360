import Link from "next/link";
import { listEmployees, hasPermission } from "@icra360/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requirePageContext } from "@/lib/context";
import { formatDateTR } from "@/lib/utils";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const ctx = await requirePageContext();
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const result = await listEmployees(ctx, { page, pageSize: 20, q: params.q });

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Personel</h1>
          <p className="text-sm text-navy/70">TCKN varsayılan olarak maskelenir.</p>
        </div>
        {hasPermission(ctx, "employee:write") ? (
          <Button asChild className="rounded-xl">
            <Link href="/employees/new">Ekle</Link>
          </Button>
        ) : null}
      </div>
      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Ad, soyad veya sicil"
          className="h-12 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-base md:h-10 md:text-sm"
        />
        <Button type="submit" variant="secondary" className="h-12 rounded-xl md:h-10">
          Ara
        </Button>
      </form>
      <div className="space-y-3 md:hidden">
        {result.items.map((employee) => {
          const current = employee.employments[0];
          return (
            <Link key={employee.id} href={`/employees/${employee.id}`}>
              <Card className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-navy">{employee.fullName}</p>
                  <Badge>{current?.status === "TERMINATED" ? "Ayrılmış" : "Aktif"}</Badge>
                </div>
                <p className="mt-1 font-mono text-xs text-navy/60">{employee.maskedNationalId}</p>
                <p className="mt-2 text-sm text-navy/75">{current?.company.legalName ?? "—"}</p>
                <p className="text-xs text-navy/55">{formatDateTR(current?.startDate)}</p>
              </Card>
            </Link>
          );
        })}
      </div>
      <div className="hidden md:block">
        <Table>
          <THead>
            <TR>
              <TH>Ad soyad</TH>
              <TH>Sicil</TH>
              <TH>TCKN</TH>
              <TH>Şirket</TH>
              <TH>Durum</TH>
              <TH>İşe giriş</TH>
            </TR>
          </THead>
          <TBody>
            {result.items.map((employee) => {
              const current = employee.employments[0];
              return (
                <TR key={employee.id}>
                  <TD>
                    <Link className="text-teal underline" href={`/employees/${employee.id}`}>
                      {employee.fullName}
                    </Link>
                  </TD>
                  <TD>{employee.employeeNumber ?? "—"}</TD>
                  <TD className="font-mono">{employee.maskedNationalId}</TD>
                  <TD>{current?.company.legalName ?? "—"}</TD>
                  <TD>
                    <Badge>{current?.status === "TERMINATED" ? "İşten ayrılmış" : "Aktif"}</Badge>
                  </TD>
                  <TD>{formatDateTR(current?.startDate)}</TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </div>
      <p className="text-xs text-navy/60">
        {result.total} kayıt · sayfa {result.page}
      </p>
    </div>
  );
}
