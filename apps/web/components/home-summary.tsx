"use client";

import { useMemo, useState } from "react";
import { SummaryChart } from "@/components/summary-chart";
import { Label } from "@/components/ui/label";
import {
  MONTHLY_BY_WORKPLACE,
  YEARLY_BY_WORKPLACE,
  companyShortLabel,
  summaryForWorkplaces,
} from "@/lib/workbench";

export type HomeCompany = { id: string; legalName: string };
export type HomeWorkplace = { id: string; name: string; companyId: string };

const selectClass =
  "h-10 w-full rounded-xl border border-slate-300 bg-white px-2.5 text-sm text-ink disabled:bg-slate-50 disabled:text-navy/40";

export function HomeSummary({
  companies,
  workplaces,
  year,
  month,
}: {
  companies: HomeCompany[];
  workplaces: HomeWorkplace[];
  year: string;
  month: string;
}) {
  const [companyId, setCompanyId] = useState("");
  const [workplaceId, setWorkplaceId] = useState("");

  const companyWorkplaces = useMemo(
    () => (companyId ? workplaces.filter((workplace) => workplace.companyId === companyId) : []),
    [companyId, workplaces],
  );

  const workplaceEnabled = Boolean(companyId);

  const scopes = useMemo(() => {
    const visible = companyId
      ? workplaces.filter((workplace) => workplace.companyId === companyId)
      : workplaces;
    const narrowed = workplaceId ? visible.filter((workplace) => workplace.id === workplaceId) : visible;
    const companyById = new Map(companies.map((company) => [company.id, company]));
    return narrowed.flatMap((workplace) => {
      const company = companyById.get(workplace.companyId);
      if (!company) {
        return [];
      }
      return [{ companyLegalName: company.legalName, workplaceName: workplace.name }];
    });
  }, [companies, workplaces, companyId, workplaceId]);

  const yearly = summaryForWorkplaces(YEARLY_BY_WORKPLACE, scopes);
  const monthly = summaryForWorkplaces(MONTHLY_BY_WORKPLACE, scopes);

  return (
    <>
      {companies.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="min-w-0">
            <Label htmlFor="ozet-sirket" className="text-[11px] text-navy/70">
              Şirket
            </Label>
            <select
              id="ozet-sirket"
              className={`${selectClass} mt-1`}
              value={companyId}
              aria-label="Şirket"
              onChange={(event) => {
                setCompanyId(event.target.value);
                setWorkplaceId("");
              }}
            >
              <option value="">Tüm şirketler</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id} title={company.legalName}>
                  {companyShortLabel(company.legalName)}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <Label htmlFor="ozet-isyeri" className="text-[11px] text-navy/70">
              İşyeri
            </Label>
            <select
              id="ozet-isyeri"
              className={`${selectClass} mt-1`}
              value={workplaceId}
              disabled={!workplaceEnabled}
              aria-label="İşyeri"
              onChange={(event) => setWorkplaceId(event.target.value)}
            >
              <option value="">Tüm işyerleri</option>
              {companyWorkplaces.map((workplace) => (
                <option key={workplace.id} value={workplace.id}>
                  {workplace.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}
      <SummaryChart title="Yıllık" period={year} counts={yearly} />
      <SummaryChart title="Bu ay" period={month} counts={monthly} />
    </>
  );
}
