import Link from "next/link";
import { getEmployee, hasPermission } from "@icra360/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { requirePageContext } from "@/lib/context";
import { formatDateTR, formatMoneyTR } from "@/lib/utils";
import { RevealNationalId } from "./reveal";

export default async function EmployeeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reveal?: string }>;
}) {
  const ctx = await requirePageContext();
  const { id } = await params;
  const query = await searchParams;
  const reveal = query.reveal === "1" && hasPermission(ctx, "sensitive:read");
  const employee = await getEmployee(ctx, id, { revealSensitive: reveal });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{employee.fullName}</h1>
          <p className="text-sm text-navy/70">Sicil: {employee.employeeNumber ?? "—"}</p>
        </div>
        {hasPermission(ctx, "employee:write") ? (
          <Button asChild variant="secondary">
            <Link href={`/employees/${employee.id}/edit`}>Düzenle</Link>
          </Button>
        ) : null}
      </div>
      <Card>
        <CardTitle>Kimlik</CardTitle>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-navy/70">T.C. kimlik no</dt>
            <dd className="font-mono">{employee.nationalId ?? employee.maskedNationalId}</dd>
          </div>
        </dl>
        <RevealNationalId canReveal={hasPermission(ctx, "sensitive:read")} revealed={reveal} />
      </Card>
      <Card>
        <CardTitle>Çalışma kayıtları</CardTitle>
        <ul className="mt-3 space-y-3">
          {employee.employments.map((employment) => (
            <li key={employment.id} className="rounded-md border border-stone-200 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{employment.company.legalName}</p>
                <Badge>{employment.status === "TERMINATED" ? "İşten ayrılmış" : "Aktif"}</Badge>
              </div>
              <p className="text-navy/70">{employment.workplace?.name ?? "İşyeri belirtilmemiş"}</p>
              <p>{employment.jobTitle ?? "Unvan yok"}</p>
              <p>
                {formatDateTR(employment.startDate)} — {employment.endDate ? formatDateTR(employment.endDate) : "devam ediyor"}
              </p>
              <p>Net ücret: {formatMoneyTR(employment.netSalary, employment.currency)}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
