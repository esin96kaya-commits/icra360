import { listCompanies, listWorkplaces } from "@icra360/domain";
import { Card } from "@/components/ui/card";
import { requirePageContext } from "@/lib/context";
import { WorkplaceCreateForm } from "./form";

export default async function WorkplacesPage() {
  const ctx = await requirePageContext();
  const [workplaces, companies] = await Promise.all([listWorkplaces(ctx), listCompanies(ctx)]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">İşyerleri</h1>
      <WorkplaceCreateForm companies={companies.map((company) => ({ id: company.id, legalName: company.legalName }))} />
      <div className="grid gap-3">
        {workplaces.map((workplace) => (
          <Card key={workplace.id}>
            <p className="font-medium">{workplace.name}</p>
            <p className="text-sm text-navy/70">{workplace.company.legalName}</p>
            <p className="text-xs text-navy/70">SGK: {workplace.sgkNumber ?? "—"}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
