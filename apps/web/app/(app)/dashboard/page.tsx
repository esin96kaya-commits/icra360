import { hasPermission, listCompanies, listWorkplaces } from "@icra360/domain";
import { HomeSummary } from "@/components/home-summary";
import { requirePageContext } from "@/lib/context";

export default async function DashboardPage() {
  const ctx = await requirePageContext();
  const year = new Intl.DateTimeFormat("tr-TR", { year: "numeric", timeZone: "Europe/Istanbul" }).format(new Date());
  const month = new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  }).format(new Date());

  const canScope = hasPermission(ctx, "company:read") && hasPermission(ctx, "workplace:read");
  const [companies, workplaces] = canScope
    ? await Promise.all([listCompanies(ctx), listWorkplaces(ctx)])
    : [[], []];

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold tracking-tight">İcra Özeti</h1>
      <HomeSummary
        year={year}
        month={month}
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
