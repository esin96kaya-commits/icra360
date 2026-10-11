import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional(),
});

export const companyCreateSchema = z.object({
  legalName: z.string().trim().min(2).max(200),
  tradeName: z.string().trim().max(200).optional(),
  taxNumber: z.string().trim().min(8).max(20),
  taxOffice: z.string().trim().max(120).optional(),
  address: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().email().optional(),
});

export const companyUpdateSchema = companyCreateSchema.partial();

export const workplaceCreateSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().trim().min(2).max(200),
  address: z.string().trim().max(500).optional(),
  registrationNumber: z.string().trim().max(80).optional(),
  sgkNumber: z.string().trim().max(80).optional(),
});

export const workplaceUpdateSchema = workplaceCreateSchema.omit({ companyId: true }).partial();

export const moneyStringSchema = z
  .string()
  .regex(/^\d+(\.\d{1,4})?$/, "Tutar ondalık metin olmalıdır.");

export const employmentInputSchema = z.object({
  companyId: z.string().uuid(),
  workplaceId: z.string().uuid().optional().nullable(),
  jobTitle: z.string().trim().max(120).optional(),
  status: z.enum(["ACTIVE", "TERMINATED"]).default("ACTIVE"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  terminationCode: z.string().trim().max(40).optional().nullable(),
  netSalary: moneyStringSchema.optional().nullable(),
  currency: z.string().length(3).default("TRY"),
});

export const employeeCreateSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  nationalId: z.string().trim().min(11).max(14),
  employeeNumber: z.string().trim().max(40).optional(),
  employment: employmentInputSchema,
});

export const employeeUpdateSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  employeeNumber: z.string().trim().max(40).optional().nullable(),
  version: z.number().int().positive(),
});

export const userCreateSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(2).max(120),
  password: z.string().min(10).max(200),
  roleCode: z.string().min(2).max(64),
  companyId: z.string().uuid().optional().nullable(),
  workplaceId: z.string().uuid().optional().nullable(),
});

export const userStatusSchema = z.object({
  status: z.enum(["ACTIVE", "DISABLED", "INVITED"]),
});

export const rolePermissionsUpdateSchema = z.object({
  permissionCodes: z.array(z.string().min(3).max(80)).min(0).max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(200),
});
