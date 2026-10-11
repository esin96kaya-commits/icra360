import type { PermissionCode } from "@icra360/contracts";

export type TenantContext = {
  userId: string;
  tenantId: string;
  email: string;
  name: string;
  permissionCodes: readonly PermissionCode[];
  companyScopeIds: readonly string[] | null;
  workplaceScopeIds: readonly string[] | null;
};

export function hasPermission(ctx: TenantContext, code: PermissionCode): boolean {
  return ctx.permissionCodes.includes(code);
}

export function canReadSensitive(ctx: TenantContext): boolean {
  return hasPermission(ctx, "sensitive:read");
}

export function isCompanyInScope(ctx: TenantContext, companyId: string): boolean {
  if (ctx.companyScopeIds === null) {
    return true;
  }
  return ctx.companyScopeIds.includes(companyId);
}
