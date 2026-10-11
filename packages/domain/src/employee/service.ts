import { decryptUtf8, encryptUtf8, hmacNationalId, isValidNationalId, maskNationalId, normalizeNationalId, toDbBytes } from "@icra360/crypto";
import { writeAuditLog } from "@icra360/audit";
import { Prisma, withTenant } from "@icra360/db";
import type { TenantContext } from "../access/context.js";
import { canReadSensitive } from "../access/context.js";
import { requireCompanyScope, requirePermission, visibleCompanyFilter } from "../access/policies.js";
import { ConflictError, NotFoundError, ValidationAppError } from "../errors.js";

export type EmploymentInput = {
  companyId: string;
  workplaceId?: string | null;
  jobTitle?: string;
  status: "ACTIVE" | "TERMINATED";
  startDate: string;
  endDate?: string | null;
  terminationCode?: string | null;
  netSalary?: string | null;
  currency?: string;
};

type EmployeeRow = {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string | null;
  nationalIdEnc: Uint8Array;
  nationalIdNonce: Uint8Array;
  version: number;
  employments: Array<{
    id: string;
    status: "ACTIVE" | "TERMINATED";
    jobTitle: string | null;
    startDate: Date;
    endDate: Date | null;
    terminationCode: string | null;
    netSalary: Prisma.Decimal | null;
    currency: string;
    company: { id: string; legalName: string };
    workplace: { id: string; name: string } | null;
  }>;
};

function dateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function salaryToDto(value: Prisma.Decimal | null, includeSensitive: boolean): string | null {
  if (value === null || !includeSensitive) {
    return null;
  }
  return value.toFixed(2);
}

function readNationalId(row: Pick<EmployeeRow, "nationalIdEnc" | "nationalIdNonce">): string {
  return decryptUtf8({
    ciphertext: Buffer.from(row.nationalIdEnc),
    nonce: Buffer.from(row.nationalIdNonce),
  });
}

function toEmployeeDto(row: EmployeeRow, includeSensitive: boolean, revealNationalId: boolean) {
  let masked = "***********";
  let nationalId: string | undefined;
  try {
    const plain = readNationalId(row);
    masked = maskNationalId(plain);
    if (revealNationalId) {
      nationalId = plain;
    }
  } catch {
    masked = "***********";
  }

  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    fullName: `${row.firstName} ${row.lastName}`,
    employeeNumber: row.employeeNumber,
    nationalId,
    maskedNationalId: masked,
    version: row.version,
    employments: row.employments.map((employment) => ({
      id: employment.id,
      status: employment.status,
      jobTitle: employment.jobTitle,
      startDate: employment.startDate.toISOString().slice(0, 10),
      endDate: employment.endDate ? employment.endDate.toISOString().slice(0, 10) : null,
      terminationCode: employment.terminationCode,
      netSalary: salaryToDto(employment.netSalary, includeSensitive),
      currency: employment.currency,
      company: employment.company,
      workplace: employment.workplace,
    })),
  };
}

export async function listEmployees(ctx: TenantContext, query: { page: number; pageSize: number; q?: string }) {
  requirePermission(ctx, "employee:read");
  const companyFilter = visibleCompanyFilter(ctx);
  const includeSensitive = canReadSensitive(ctx);

  return withTenant(ctx.tenantId, async (tx) => {
    const where = {
      tenantId: ctx.tenantId,
      deletedAt: null,
      ...(query.q
        ? {
            OR: [
              { firstName: { contains: query.q, mode: "insensitive" as const } },
              { lastName: { contains: query.q, mode: "insensitive" as const } },
              { employeeNumber: { contains: query.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(companyFilter
        ? {
            employments: {
              some: { companyId: companyFilter, deletedAt: null },
            },
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      tx.employee.count({ where }),
      tx.employee.findMany({
        where,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: {
          employments: {
            where: { deletedAt: null, ...(companyFilter ? { companyId: companyFilter } : {}) },
            include: {
              company: { select: { id: true, legalName: true } },
              workplace: { select: { id: true, name: true } },
            },
            orderBy: { startDate: "desc" },
          },
        },
      }),
    ]);

    return {
      total,
      page: query.page,
      pageSize: query.pageSize,
      items: rows.map((row) => toEmployeeDto(row, includeSensitive, false)),
    };
  });
}

export async function getEmployee(ctx: TenantContext, id: string, options?: { revealSensitive?: boolean }) {
  requirePermission(ctx, "employee:read");
  const includeSensitive = Boolean(options?.revealSensitive) && canReadSensitive(ctx);
  const companyFilter = visibleCompanyFilter(ctx);

  const employee = await withTenant(ctx.tenantId, (tx) =>
    tx.employee.findFirst({
      where: {
        id,
        tenantId: ctx.tenantId,
        deletedAt: null,
        ...(companyFilter
          ? { employments: { some: { companyId: companyFilter, deletedAt: null } } }
          : {}),
      },
      include: {
        employments: {
          where: { deletedAt: null },
          include: {
            company: { select: { id: true, legalName: true } },
            workplace: { select: { id: true, name: true } },
          },
          orderBy: { startDate: "desc" },
        },
      },
    }),
  );

  if (!employee) {
    throw new NotFoundError();
  }

  if (includeSensitive) {
    await writeAuditLog({
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      action: "sensitive.reveal",
      entityType: "Employee",
      entityId: employee.id,
    });
  }

  return toEmployeeDto(employee, includeSensitive, includeSensitive);
}

export async function createEmployee(
  ctx: TenantContext,
  input: {
    firstName: string;
    lastName: string;
    nationalId: string;
    employeeNumber?: string;
    employment: EmploymentInput;
  },
) {
  requirePermission(ctx, "employee:write");
  requireCompanyScope(ctx, input.employment.companyId);

  const nationalId = normalizeNationalId(input.nationalId);
  if (!isValidNationalId(nationalId)) {
    throw new ValidationAppError("T.C. kimlik numarası geçersiz.", { nationalId: "Geçersiz" });
  }

  const hmac = hmacNationalId(nationalId);
  const encrypted = encryptUtf8(nationalId);

  return withTenant(ctx.tenantId, async (tx) => {
    const company = await tx.company.findFirst({
      where: { id: input.employment.companyId, tenantId: ctx.tenantId, deletedAt: null },
    });
    if (!company) {
      throw new NotFoundError();
    }
    if (input.employment.workplaceId) {
      const workplace = await tx.workplace.findFirst({
        where: {
          id: input.employment.workplaceId,
          companyId: company.id,
          tenantId: ctx.tenantId,
          deletedAt: null,
        },
      });
      if (!workplace) {
        throw new NotFoundError();
      }
    }

    try {
      const created = await tx.employee.create({
        data: {
          tenantId: ctx.tenantId,
          firstName: input.firstName,
          lastName: input.lastName,
          employeeNumber: input.employeeNumber,
          nationalIdEnc: toDbBytes(encrypted.ciphertext),
          nationalIdNonce: toDbBytes(encrypted.nonce),
          nationalIdHmac: toDbBytes(hmac),
          employments: {
            create: {
              tenantId: ctx.tenantId,
              companyId: input.employment.companyId,
              workplaceId: input.employment.workplaceId ?? null,
              jobTitle: input.employment.jobTitle,
              status: input.employment.status,
              startDate: dateOnly(input.employment.startDate),
              endDate: input.employment.endDate ? dateOnly(input.employment.endDate) : null,
              terminationCode: input.employment.terminationCode,
              netSalary: input.employment.netSalary ? new Prisma.Decimal(input.employment.netSalary) : null,
              currency: input.employment.currency ?? "TRY",
            },
          },
        },
        include: {
          employments: {
            include: {
              company: { select: { id: true, legalName: true } },
              workplace: { select: { id: true, name: true } },
            },
          },
        },
      });

      await writeAuditLog({
        tenantId: ctx.tenantId,
        actorId: ctx.userId,
        action: "employee.create",
        entityType: "Employee",
        entityId: created.id,
        tx,
      });

      return toEmployeeDto(created, canReadSensitive(ctx), false);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError("Bu T.C. kimlik numarası bu kiracıda zaten kayıtlı.");
      }
      throw error;
    }
  });
}

export async function updateEmployee(
  ctx: TenantContext,
  id: string,
  input: {
    firstName?: string;
    lastName?: string;
    employeeNumber?: string | null;
    version: number;
  },
) {
  requirePermission(ctx, "employee:write");
  await getEmployee(ctx, id);
  return withTenant(ctx.tenantId, async (tx) => {
    const updated = await tx.employee.updateMany({
      where: { id, tenantId: ctx.tenantId, version: input.version, deletedAt: null },
      data: {
        ...(input.firstName ? { firstName: input.firstName } : {}),
        ...(input.lastName ? { lastName: input.lastName } : {}),
        ...(input.employeeNumber !== undefined ? { employeeNumber: input.employeeNumber } : {}),
        version: { increment: 1 },
      },
    });
    if (updated.count !== 1) {
      throw new ConflictError("Kayıt başka bir kullanıcı tarafından değiştirilmiş.");
    }
    await writeAuditLog({
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      action: "employee.update",
      entityType: "Employee",
      entityId: id,
      tx,
    });
    return getEmployee(ctx, id);
  });
}
