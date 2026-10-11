import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

const appUrl = process.env.DATABASE_URL;
const migrateUrl = process.env.DATABASE_MIGRATE_URL;

const shouldRun = process.env.RUN_INTEGRATION === "1";

describe.skipIf(!shouldRun)("tenant RLS", () => {
  let admin: PrismaClient;
  let app: PrismaClient;
  let tenantA: string;
  let tenantB: string;
  let employeeA: string;
  let employeeB: string;

  beforeAll(async () => {
    admin = new PrismaClient({ datasources: { db: { url: migrateUrl } } });
    app = new PrismaClient({ datasources: { db: { url: appUrl } } });
    const a = await admin.tenant.findUniqueOrThrow({ where: { slug: "demo-a" } });
    const b = await admin.tenant.findUniqueOrThrow({ where: { slug: "demo-b" } });
    tenantA = a.id;
    tenantB = b.id;
    const empA = await admin.employee.findFirstOrThrow({ where: { tenantId: tenantA } });
    const empB = await admin.employee.findFirstOrThrow({ where: { tenantId: tenantB } });
    employeeA = empA.id;
    employeeB = empB.id;
  });

  afterAll(async () => {
    await admin.$disconnect();
    await app.$disconnect();
  });

  it("app role without tenant setting sees no employees", async () => {
    const rows = await app.$queryRaw<{ count: bigint }[]>`SELECT count(*)::bigint AS count FROM employees`;
    expect(Number(rows[0]?.count ?? -1)).toBe(0);
  });

  it("tenant A session cannot read tenant B employee rows", async () => {
    await app.$executeRaw`SELECT set_config('app.tenant_id', ${tenantA}, false)`;
    const visible = await app.$queryRaw<{ id: string }[]>`
      SELECT id FROM employees WHERE id = ${employeeA}::uuid
    `;
    const hidden = await app.$queryRaw<{ id: string }[]>`
      SELECT id FROM employees WHERE id = ${employeeB}::uuid
    `;
    expect(visible).toHaveLength(1);
    expect(hidden).toHaveLength(0);
  });
});
