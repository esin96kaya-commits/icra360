import { describe, expect, it } from "vitest";
import { employeeCreateSchema, isPermissionCode, PERMISSION_CODES } from "./index.js";

describe("contracts", () => {
  it("recognizes catalog permission codes", () => {
    expect(isPermissionCode("employee:read")).toBe(true);
    expect(isPermissionCode("not-a-permission")).toBe(false);
    expect(PERMISSION_CODES.includes("sensitive:read")).toBe(true);
  });

  it("rejects floating point money numbers", () => {
    const parsed = employeeCreateSchema.safeParse({
      firstName: "Ada",
      lastName: "Deneme",
      nationalId: "10000000146",
      employment: {
        companyId: "11111111-1111-1111-1111-111111111111",
        startDate: "2020-01-01",
        netSalary: 1234.56,
      },
    });
    expect(parsed.success).toBe(false);
  });
});
