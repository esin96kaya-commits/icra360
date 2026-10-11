import { listCompanies, listWorkplaces } from "@icra360/domain";
import { requirePageContext } from "@/lib/context";
import { EmployeeCreateForm } from "./form";

export default async function NewEmployeePage() {
  const ctx = await requirePageContext();
  const [companies, workplaces] = await Promise.all([listCompanies(ctx), listWorkplaces(ctx)]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Personel ekle</h1>
      <EmployeeCreateForm
        companies={companies.map((company) => ({ id: company.id, legalName: company.legalName }))}
        workplaces={workplaces.map((workplace) => ({
          id: workplace.id,
          name: workplace.name,
          companyId: workplace.companyId,
        }))}
      />
    </div>
  );
}
