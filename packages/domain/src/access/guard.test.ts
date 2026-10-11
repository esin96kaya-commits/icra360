import { describe, expect, it } from "vitest";
import type { TenantContext } from "./context.js";
import { canReadSensitive, hasPermission, isCompanyInScope } from "./context.js";
import { requireCompanyScope, requirePermission, visibleCompanyFilter } from "./policies.js";
import { ForbiddenError } from "../errors.js";

function ctx(partial: Partial<TenantContext>): TenantContext {
  return {
    userId: "u1",
    tenantId: "t1",
    email: "a@example.com",
    name: "Ada",
    permissionCodes: ["employee:read"],
    companyScopeIds: ["c1"],
    workplaceScopeIds: null,
    ...partial,
  };
}

describe("access policies", () => {
  it("allows tenant-wide company access when scope is null", () => {
    const admin = ctx({ companyScopeIds: null, permissionCodes: ["employee:read", "sensitive:read"] });
    expect(isCompanyInScope(admin, "any")).toBe(true);
    expect(canReadSensitive(admin)).toBe(true);
    expect(visibleCompanyFilter(admin)).toBeUndefined();
  });

  it("blocks companies outside assignment scope", () => {
    const hr = ctx({ companyScopeIds: ["c1"] });
    expect(isCompanyInScope(hr, "c1")).toBe(true);
    expect(isCompanyInScope(hr, "c2")).toBe(false);
    expect(() => requireCompanyScope(hr, "c2")).toThrow(ForbiddenError);
    expect(visibleCompanyFilter(hr)).toEqual({ in: ["c1"] });
  });

  it("forbids actions when permission is missing", () => {
    const auditor = ctx({ permissionCodes: ["employee:read"] });
    expect(hasPermission(auditor, "employee:read")).toBe(true);
    expect(() => requirePermission(auditor, "employee:write")).toThrow(ForbiddenError);
    expect(canReadSensitive(auditor)).toBe(false);
  });
});
