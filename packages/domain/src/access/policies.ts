import { ForbiddenError } from "../errors.js";
import { type TenantContext, hasPermission } from "./context.js";
import type { PermissionCode } from "@icra360/contracts";

export function requirePermission(ctx: TenantContext, code: PermissionCode): void {
  if (!hasPermission(ctx, code)) {
    throw new ForbiddenError();
  }
}

export function requireCompanyScope(ctx: TenantContext, companyId: string): void {
  if (ctx.companyScopeIds === null) {
    return;
  }
  if (!ctx.companyScopeIds.includes(companyId)) {
    throw new ForbiddenError();
  }
}

export function visibleCompanyFilter(ctx: TenantContext): { in: string[] } | undefined {
  if (ctx.companyScopeIds === null) {
    return undefined;
  }
  return { in: [...ctx.companyScopeIds] };
}
