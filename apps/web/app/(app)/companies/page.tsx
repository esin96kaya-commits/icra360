import { listCompanies } from "@icra360/domain";
import { Card } from "@/components/ui/card";
import { requirePageContext } from "@/lib/context";
import { CompanyCreateForm } from "./form";

export default async function CompaniesPage() {
  const ctx = await requirePageContext();
  const companies = await listCompanies(ctx);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Şirketler</h1>
      <CompanyCreateForm />
      <div className="grid gap-3">
        {companies.map((company) => (
          <Card key={company.id}>
            <p className="font-medium">{company.legalName}</p>
            <p className="text-sm text-navy/70">VKN: {company.taxNumber}</p>
            <p className="text-xs text-navy/70">
              {company._count.workplaces} işyeri · {company._count.employments} çalışma kaydı
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
