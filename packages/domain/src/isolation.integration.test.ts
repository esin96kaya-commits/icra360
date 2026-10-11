import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prismaAdmin } from "@icra360/db";
import { ForbiddenError, NotFoundError } from "./errors.js";
import { getEmployee } from "./employee/service.js";
import { loadTenantContext } from "./access/load-context.js";
import { requirePermission } from "./access/policies.js";

const shouldRun = process.env.RUN_INTEGRATION === "1";

describe.skipIf(!shouldRun)("tenant and company isolation", () => {
  beforeAll(async () => {
    await prismaAdmin.tenant.findUniqueOrThrow({ where: { slug: "demo-a" } });
  });

  afterAll(async () => {
    await prismaAdmin.$disconnect();
  });

  it("does not return another tenant's employee", async () => {
    const adminA = await prismaAdmin.user.findFirstOrThrow({
      where: { email: "admin-a@example.com" },
    });
    const other = await prismaAdmin.employee.findFirstOrThrow({
      where: { tenant: { slug: "demo-b" } },
    });
    const ctx = await loadTenantContext(adminA.id, adminA.tenantId);
    await expect(getEmployee(ctx, other.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("hides another company's employee from a scoped HR user", async () => {
    const hr = await prismaAdmin.user.findFirstOrThrow({ where: { email: "ik-a@example.com" } });
    const logisticsEmployee = await prismaAdmin.employee.findFirstOrThrow({
      where: { employeeNumber: "L-2001" },
    });
    const ctx = await loadTenantContext(hr.id, hr.tenantId);
    await expect(getEmployee(ctx, logisticsEmployee.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("does not include raw national id without sensitive:read", async () => {
    const hr = await prismaAdmin.user.findFirstOrThrow({ where: { email: "ik-a@example.com" } });
    const employee = await prismaAdmin.employee.findFirstOrThrow({
      where: { employeeNumber: "A-1001" },
    });
    const ctx = await loadTenantContext(hr.id, hr.tenantId);
    const dto = await getEmployee(ctx, employee.id, { revealSensitive: true });
    expect(dto.nationalId).toBeUndefined();
    expect(dto.maskedNationalId.includes("*")).toBe(true);
  });

  it("forbids employee write after the permission is removed from the role", async () => {
    const hr = await prismaAdmin.user.findFirstOrThrow({
      where: { email: "ik-a@example.com" },
    });
    const ctx = await loadTenantContext(hr.id, hr.tenantId);
    const stripped = {
      ...ctx,
      permissionCodes: ctx.permissionCodes.filter((code) => code !== "employee:write"),
    };
    expect(() => requirePermission(stripped, "employee:write")).toThrow(ForbiddenError);
  });
});
