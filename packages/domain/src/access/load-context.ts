import { isPermissionCode } from "@icra360/contracts";
import { withTenant } from "@icra360/db";
import { ForbiddenError, UnauthorizedError } from "../errors.js";
import type { TenantContext } from "./context.js";

const TENANT_WIDE_ROLES = new Set(["TENANT_ADMIN"]);

export async function loadTenantContext(userId: string, tenantId: string): Promise<TenantContext> {
  const user = await withTenant(tenantId, (tx) =>
    tx.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    }),
  );

  if (!user || user.status === "DISABLED") {
    throw new UnauthorizedError();
  }

  const permissionCodes = [
    ...new Set(
      user.roles.flatMap((assignment) =>
        assignment.role.permissions
          .map((item) => item.permission.code)
          .filter(isPermissionCode),
      ),
    ),
  ];

  const hasTenantWide = user.roles.some(
    (assignment) => assignment.companyId === null && TENANT_WIDE_ROLES.has(assignment.role.code),
  );

  const companyScopeIds = hasTenantWide
    ? null
    : [
        ...new Set(
          user.roles
            .map((assignment) => assignment.companyId)
            .filter((value): value is string => typeof value === "string"),
        ),
      ];

  const workplaceIds = [
    ...new Set(
      user.roles
        .map((assignment) => assignment.workplaceId)
        .filter((value): value is string => typeof value === "string"),
    ),
  ];

  return {
    userId: user.id,
    tenantId: user.tenantId,
    email: user.email,
    name: user.name,
    permissionCodes,
    companyScopeIds,
    workplaceScopeIds: workplaceIds.length > 0 ? workplaceIds : null,
  };
}

export function ensureAliveContext(ctx: TenantContext): TenantContext {
  if (!ctx.userId || !ctx.tenantId) {
    throw new ForbiddenError();
  }
  return ctx;
}
