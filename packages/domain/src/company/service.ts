import { Prisma, withTenant } from "@icra360/db";
import type { TenantContext } from "../access/context.js";
import { requireCompanyScope, requirePermission, visibleCompanyFilter } from "../access/policies.js";
import { ConflictError, NotFoundError, ValidationAppError } from "../errors.js";

function notDeleted() {
  return { deletedAt: null };
}

export async function listCompanies(ctx: TenantContext) {
  requirePermission(ctx, "company:read");
  const companyId = visibleCompanyFilter(ctx);
  return withTenant(ctx.tenantId, (tx) =>
    tx.company.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...notDeleted(),
        ...(companyId ? { id: companyId } : {}),
      },
      orderBy: { legalName: "asc" },
      include: { _count: { select: { workplaces: true, employments: true } } },
    }),
  );
}

export async function getCompany(ctx: TenantContext, id: string) {
  requirePermission(ctx, "company:read");
  const company = await withTenant(ctx.tenantId, (tx) =>
    tx.company.findFirst({
      where: { id, tenantId: ctx.tenantId, ...notDeleted() },
    }),
  );
  if (!company) {
    throw new NotFoundError();
  }
  requireCompanyScope(ctx, company.id);
  return company;
}

export async function createCompany(
  ctx: TenantContext,
  input: {
    legalName: string;
    tradeName?: string;
    taxNumber: string;
    taxOffice?: string;
    address?: string;
    phone?: string;
    email?: string;
  },
) {
  requirePermission(ctx, "company:write");
  if (ctx.companyScopeIds !== null) {
    throw new ValidationAppError("Şirket oluşturma yalnızca tenant yöneticisine açıktır.");
  }
  try {
    return await withTenant(ctx.tenantId, (tx) =>
      tx.company.create({
        data: {
          tenantId: ctx.tenantId,
          legalName: input.legalName,
          tradeName: input.tradeName,
          taxNumber: input.taxNumber,
          taxOffice: input.taxOffice,
          address: input.address,
          phone: input.phone,
          email: input.email,
        },
      }),
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictError("Bu vergi numarası zaten kayıtlı.");
    }
    throw error;
  }
}

export async function updateCompany(
  ctx: TenantContext,
  id: string,
  input: Partial<{
    legalName: string;
    tradeName: string;
    taxNumber: string;
    taxOffice: string;
    address: string;
    phone: string;
    email: string;
  }>,
) {
  requirePermission(ctx, "company:write");
  const existing = await getCompany(ctx, id);
  return withTenant(ctx.tenantId, (tx) =>
    tx.company.update({
      where: { id: existing.id },
      data: {
        ...input,
        version: { increment: 1 },
      },
    }),
  );
}
