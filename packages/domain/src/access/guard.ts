import type { PermissionCode } from "@icra360/contracts";
import { withTenant } from "@icra360/db";
import { ForbiddenError } from "../errors.js";
import { type TenantContext } from "./context.js";

export function assertPermission(ctx: TenantContext, code: PermissionCode): void {
  if (!ctx.permissionCodes.includes(code)) {
    throw new ForbiddenError();
  }
}

export function assertCompanyAccess(ctx: TenantContext, companyId: string): void {
  if (ctx.companyScopeIds === null) {
    return;
  }
  if (!ctx.companyScopeIds.includes(companyId)) {
    throw new ForbiddenError();
  }
}

export async function withAuthorizedTenant<T>(
  ctx: TenantContext,
  fn: Parameters<typeof withTenant<T>>[1],
): Promise<T> {
  return withTenant(ctx.tenantId, fn);
}
