import argon2 from "argon2";
import { Prisma, withTenant } from "@icra360/db";
import { isPermissionCode, type PermissionCode } from "@icra360/contracts";
import { writeAuditLog } from "@icra360/audit";
import type { TenantContext } from "../access/context.js";
import { requirePermission } from "../access/policies.js";
import { ConflictError, NotFoundError, ValidationAppError } from "../errors.js";

export async function listUsers(ctx: TenantContext) {
  requirePermission(ctx, "user:read");
  return withTenant(ctx.tenantId, (tx) =>
    tx.user.findMany({
      where: { tenantId: ctx.tenantId, deletedAt: null },
      orderBy: { name: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        lastLoginAt: true,
        roles: {
          include: {
            role: { select: { id: true, code: true, name: true } },
            company: { select: { id: true, legalName: true } },
          },
        },
      },
    }),
  );
}

export async function createUser(
  ctx: TenantContext,
  input: {
    email: string;
    name: string;
    password: string;
    roleCode: string;
    companyId?: string | null;
    workplaceId?: string | null;
  },
) {
  requirePermission(ctx, "user:write");
  const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });

  return withTenant(ctx.tenantId, async (tx) => {
    const role = await tx.role.findFirst({
      where: { tenantId: ctx.tenantId, code: input.roleCode },
    });
    if (!role) {
      throw new ValidationAppError("Rol bulunamadı.");
    }
    if (role.code !== "TENANT_ADMIN" && !input.companyId) {
      throw new ValidationAppError("Tenant yöneticisi dışındaki roller için şirket kapsamı zorunludur.");
    }
    try {
      const created = await tx.user.create({
        data: {
          tenantId: ctx.tenantId,
          email: input.email.toLowerCase(),
          name: input.name,
          passwordHash,
          status: "ACTIVE",
          roles: {
            create: {
              roleId: role.id,
              companyId: role.code === "TENANT_ADMIN" ? null : input.companyId,
              workplaceId: input.workplaceId ?? null,
            },
          },
        },
      });
      await writeAuditLog({
        tenantId: ctx.tenantId,
        actorId: ctx.userId,
        action: "user.create",
        entityType: "User",
        entityId: created.id,
        tx,
      });
      return { id: created.id, email: created.email, name: created.name, status: created.status };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError("Bu e-posta adresi zaten kayıtlı.");
      }
      throw error;
    }
  });
}

export async function listRoles(ctx: TenantContext) {
  requirePermission(ctx, "role:read");
  return withTenant(ctx.tenantId, (tx) =>
    tx.role.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { name: "asc" },
      include: {
        permissions: { include: { permission: true } },
      },
    }),
  );
}

export async function updateRolePermissions(ctx: TenantContext, roleId: string, permissionCodes: string[]) {
  requirePermission(ctx, "role:write");
  const codes = permissionCodes.filter(isPermissionCode);
  if (codes.length !== permissionCodes.length) {
    throw new ValidationAppError("Geçersiz izin kodu.");
  }

  return withTenant(ctx.tenantId, async (tx) => {
    const role = await tx.role.findFirst({
      where: { id: roleId, tenantId: ctx.tenantId },
    });
    if (!role) {
      throw new NotFoundError();
    }
    const permissions = await tx.permission.findMany({
      where: { code: { in: codes } },
    });
    await tx.rolePermission.deleteMany({ where: { roleId: role.id } });
    await tx.rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId: role.id,
        permissionId: permission.id,
      })),
    });
    await writeAuditLog({
      tenantId: ctx.tenantId,
      actorId: ctx.userId,
      action: "role.permissions.update",
      entityType: "Role",
      entityId: role.id,
      tx,
    });
    return { id: role.id, permissionCount: permissions.length };
  });
}

export async function listPermissions(ctx: TenantContext) {
  requirePermission(ctx, "role:read");
  return withTenant(ctx.tenantId, (tx) => tx.permission.findMany({ orderBy: { code: "asc" } }));
}

export function uniquePermissionCodes(codes: string[]): PermissionCode[] {
  return [...new Set(codes.filter(isPermissionCode))];
}
