import { withTenant } from "@icra360/db";
import type { TenantContext } from "../access/context.js";
import { requireCompanyScope, requirePermission, visibleCompanyFilter } from "../access/policies.js";
import { NotFoundError, ValidationAppError } from "../errors.js";

export async function listWorkplaces(ctx: TenantContext, companyId?: string) {
  requirePermission(ctx, "workplace:read");
  if (companyId) {
    requireCompanyScope(ctx, companyId);
  }
  const companyFilter = visibleCompanyFilter(ctx);
  return withTenant(ctx.tenantId, (tx) =>
    tx.workplace.findMany({
      where: {
        tenantId: ctx.tenantId,
        deletedAt: null,
        ...(companyId ? { companyId } : {}),
        ...(companyFilter ? { companyId: companyFilter } : {}),
      },
      include: { company: { select: { id: true, legalName: true } } },
      orderBy: { name: "asc" },
    }),
  );
}

export async function createWorkplace(
  ctx: TenantContext,
  input: {
    companyId: string;
    name: string;
    address?: string;
    registrationNumber?: string;
    sgkNumber?: string;
  },
) {
  requirePermission(ctx, "workplace:write");
  requireCompanyScope(ctx, input.companyId);
  const company = await withTenant(ctx.tenantId, (tx) =>
    tx.company.findFirst({
      where: { id: input.companyId, tenantId: ctx.tenantId, deletedAt: null },
    }),
  );
  if (!company) {
    throw new NotFoundError();
  }
  return withTenant(ctx.tenantId, (tx) =>
    tx.workplace.create({
      data: {
        tenantId: ctx.tenantId,
        companyId: input.companyId,
        name: input.name,
        address: input.address,
        registrationNumber: input.registrationNumber,
        sgkNumber: input.sgkNumber,
      },
    }),
  );
}

export async function updateWorkplace(
  ctx: TenantContext,
  id: string,
  input: Partial<{
    name: string;
    address: string;
    registrationNumber: string;
    sgkNumber: string;
  }>,
) {
  requirePermission(ctx, "workplace:write");
  const workplace = await withTenant(ctx.tenantId, (tx) =>
    tx.workplace.findFirst({
      where: { id, tenantId: ctx.tenantId, deletedAt: null },
    }),
  );
  if (!workplace) {
    throw new NotFoundError();
  }
  requireCompanyScope(ctx, workplace.companyId);
  if (Object.keys(input).length === 0) {
    throw new ValidationAppError("Güncellenecek alan yok.");
  }
  return withTenant(ctx.tenantId, (tx) =>
    tx.workplace.update({
      where: { id: workplace.id },
      data: { ...input, version: { increment: 1 } },
    }),
  );
}
