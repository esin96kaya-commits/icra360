import { withTenant } from "@icra360/db";
import type { TenantContext } from "../access/context.js";
import { visibleCompanyFilter } from "../access/policies.js";

export async function getDashboardSummary(ctx: TenantContext) {
  const companyFilter = visibleCompanyFilter(ctx);
  return withTenant(ctx.tenantId, async (tx) => {
    const [companyCount, workplaceCount, employeeCount, userCount] = await Promise.all([
      tx.company.count({
        where: { tenantId: ctx.tenantId, deletedAt: null, ...(companyFilter ? { id: companyFilter } : {}) },
      }),
      tx.workplace.count({
        where: {
          tenantId: ctx.tenantId,
          deletedAt: null,
          ...(companyFilter ? { companyId: companyFilter } : {}),
        },
      }),
      tx.employee.count({
        where: {
          tenantId: ctx.tenantId,
          deletedAt: null,
          ...(companyFilter
            ? { employments: { some: { companyId: companyFilter, deletedAt: null } } }
            : {}),
        },
      }),
      tx.user.count({ where: { tenantId: ctx.tenantId, deletedAt: null } }),
    ]);

    return {
      companyCount,
      workplaceCount,
      employeeCount,
      userCount,
    };
  });
}
