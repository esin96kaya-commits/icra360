import argon2 from "argon2";
import { PERMISSION_CATALOG, SYSTEM_ROLE_CODES, SYSTEM_ROLE_NAMES, SYSTEM_ROLE_PERMISSIONS } from "@icra360/contracts";
import { encryptUtf8, generateValidNationalId, hmacNationalId, toDbBytes } from "@icra360/crypto";
import { Prisma, prismaAdmin } from "./index.js";

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "Demo.Sifre.123!";

async function upsertPermissions() {
  for (const permission of PERMISSION_CATALOG) {
    await prismaAdmin.permission.upsert({
      where: { code: permission.code },
      update: { description: permission.description },
      create: permission,
    });
  }
}

async function seedTenant(input: {
  slug: string;
  name: string;
  companies: Array<{
    legalName: string;
    taxNumber: string;
    workplaces: Array<{ name: string; sgkNumber: string }>;
  }>;
  users: Array<{
    email: string;
    name: string;
    roleCode: (typeof SYSTEM_ROLE_CODES)[number];
    companyIndex?: number;
  }>;
  employees: Array<{
    firstName: string;
    lastName: string;
    seed: number;
    employeeNumber: string;
    companyIndex: number;
    workplaceIndex: number;
    jobTitle: string;
    netSalary: string;
    startDate: Date;
    endDate?: Date;
  }>;
}) {
  const tenant = await prismaAdmin.tenant.upsert({
    where: { slug: input.slug },
    update: { name: input.name, status: "ACTIVE" },
    create: { slug: input.slug, name: input.name, status: "ACTIVE" },
  });

  const permissionRows = await prismaAdmin.permission.findMany();
  const permissionByCode = new Map(permissionRows.map((row) => [row.code, row.id]));

  for (const code of SYSTEM_ROLE_CODES) {
    const role = await prismaAdmin.role.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code } },
      update: { name: SYSTEM_ROLE_NAMES[code], isSystem: true },
      create: {
        tenantId: tenant.id,
        code,
        name: SYSTEM_ROLE_NAMES[code],
        isSystem: true,
      },
    });
    await prismaAdmin.rolePermission.deleteMany({ where: { roleId: role.id } });
    const permissionIds = SYSTEM_ROLE_PERMISSIONS[code]
      .map((perm) => permissionByCode.get(perm))
      .filter((id): id is string => typeof id === "string");
    await prismaAdmin.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
      skipDuplicates: true,
    });
  }

  const companies = [];
  for (const companyInput of input.companies) {
    const company = await prismaAdmin.company.upsert({
      where: { tenantId_taxNumber: { tenantId: tenant.id, taxNumber: companyInput.taxNumber } },
      update: { legalName: companyInput.legalName, deletedAt: null },
      create: {
        tenantId: tenant.id,
        legalName: companyInput.legalName,
        taxNumber: companyInput.taxNumber,
      },
    });
    const workplaces = [];
    for (const workplaceInput of companyInput.workplaces) {
      const existing = await prismaAdmin.workplace.findFirst({
        where: { tenantId: tenant.id, companyId: company.id, name: workplaceInput.name },
      });
      const workplace =
        existing ??
        (await prismaAdmin.workplace.create({
          data: {
            tenantId: tenant.id,
            companyId: company.id,
            name: workplaceInput.name,
            sgkNumber: workplaceInput.sgkNumber,
          },
        }));
      workplaces.push(workplace);
    }
    companies.push({ ...company, workplaces });
  }

  const passwordHash = await argon2.hash(SEED_PASSWORD, { type: argon2.argon2id });
  const roles = await prismaAdmin.role.findMany({ where: { tenantId: tenant.id } });

  for (const userInput of input.users) {
    const user = await prismaAdmin.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: userInput.email } },
      update: { name: userInput.name, passwordHash, status: "ACTIVE", deletedAt: null },
      create: {
        tenantId: tenant.id,
        email: userInput.email,
        name: userInput.name,
        passwordHash,
        status: "ACTIVE",
      },
    });
    const role = roles.find((item) => item.code === userInput.roleCode);
    if (!role) {
      continue;
    }
    await prismaAdmin.userRole.deleteMany({ where: { userId: user.id } });
    const companyId =
      userInput.roleCode === "TENANT_ADMIN" || userInput.companyIndex === undefined
        ? null
        : (companies[userInput.companyIndex]?.id ?? null);
    await prismaAdmin.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
        companyId,
      },
    });
  }

  for (const employeeInput of input.employees) {
    const company = companies[employeeInput.companyIndex];
    const workplace = company?.workplaces[employeeInput.workplaceIndex];
    if (!company || !workplace) {
      continue;
    }
    const nationalId = generateValidNationalId(employeeInput.seed);
    const hmac = hmacNationalId(nationalId);
    const encrypted = encryptUtf8(nationalId);
    const existing = await prismaAdmin.employee.findFirst({
      where: { tenantId: tenant.id, nationalIdHmac: toDbBytes(hmac) },
    });
    if (existing) {
      continue;
    }
    await prismaAdmin.employee.create({
      data: {
        tenantId: tenant.id,
        firstName: employeeInput.firstName,
        lastName: employeeInput.lastName,
        employeeNumber: employeeInput.employeeNumber,
        nationalIdEnc: toDbBytes(encrypted.ciphertext),
        nationalIdNonce: toDbBytes(encrypted.nonce),
        nationalIdHmac: toDbBytes(hmac),
        employments: {
          create: {
            tenantId: tenant.id,
            companyId: company.id,
            workplaceId: workplace.id,
            jobTitle: employeeInput.jobTitle,
            status: employeeInput.endDate ? "TERMINATED" : "ACTIVE",
            startDate: employeeInput.startDate,
            endDate: employeeInput.endDate ?? null,
            netSalary: new Prisma.Decimal(employeeInput.netSalary),
            currency: "TRY",
          },
        },
      },
    });
  }
}

async function main() {
  await upsertPermissions();

  await seedTenant({
    slug: "demo-a",
    name: "Demo A Holding",
    companies: [
      {
        legalName: "Demo A Tekstil Anonim Şirketi",
        taxNumber: "1111111111",
        workplaces: [{ name: "Merkez Fabrika", sgkNumber: "A-001" }],
      },
      {
        legalName: "Demo A Lojistik Limited Şirketi",
        taxNumber: "2222222222",
        workplaces: [{ name: "Ambar", sgkNumber: "A-002" }],
      },
    ],
    users: [
      { email: "admin-a@example.com", name: "Ayşe Yönetici", roleCode: "TENANT_ADMIN" },
      { email: "ik-a@example.com", name: "Berk İK", roleCode: "HR_SPECIALIST", companyIndex: 0 },
      { email: "bordro-a@example.com", name: "Ceren Bordro", roleCode: "PAYROLL_SPECIALIST", companyIndex: 0 },
      { email: "denetci-a@example.com", name: "Deniz Denetçi", roleCode: "AUDITOR", companyIndex: 0 },
    ],
    employees: [
      {
        firstName: "Elif",
        lastName: "Örnek",
        seed: 101,
        employeeNumber: "A-1001",
        companyIndex: 0,
        workplaceIndex: 0,
        jobTitle: "Üretim operatörü",
        netSalary: "32000.00",
        startDate: new Date("2019-03-01T00:00:00Z"),
      },
      {
        firstName: "Mert",
        lastName: "Deneme",
        seed: 102,
        employeeNumber: "A-1002",
        companyIndex: 0,
        workplaceIndex: 0,
        jobTitle: "Depo sorumlusu",
        netSalary: "28000.00",
        startDate: new Date("2021-06-15T00:00:00Z"),
        endDate: new Date("2024-11-30T00:00:00Z"),
      },
      {
        firstName: "Selin",
        lastName: "Taslak",
        seed: 201,
        employeeNumber: "L-2001",
        companyIndex: 1,
        workplaceIndex: 0,
        jobTitle: "Şoför",
        netSalary: "26500.00",
        startDate: new Date("2022-01-10T00:00:00Z"),
      },
    ],
  });

  await seedTenant({
    slug: "demo-b",
    name: "Demo B Gıda",
    companies: [
      {
        legalName: "Demo B Gıda Sanayi Anonim Şirketi",
        taxNumber: "3333333333",
        workplaces: [{ name: "Üretim Tesisi", sgkNumber: "B-001" }],
      },
    ],
    users: [{ email: "admin-b@example.com", name: "Bora Yönetici", roleCode: "TENANT_ADMIN" }],
    employees: [
      {
        firstName: "Hakan",
        lastName: "Kurgusal",
        seed: 301,
        employeeNumber: "B-3001",
        companyIndex: 0,
        workplaceIndex: 0,
        jobTitle: "Kalite uzmanı",
        netSalary: "34500.00",
        startDate: new Date("2020-09-01T00:00:00Z"),
      },
    ],
  });
}

main()
  .then(async () => {
    await prismaAdmin.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prismaAdmin.$disconnect();
    process.exit(1);
  });
