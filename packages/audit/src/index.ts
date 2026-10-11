import { Prisma, prisma, type PrismaClient } from "@icra360/db";

type AuditClient = Prisma.TransactionClient | PrismaClient;

export type AuditInput = {
  tenantId?: string | null;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  beforeDigest?: string | null;
  afterDigest?: string | null;
  metadata?: Prisma.InputJsonValue;
  tx?: AuditClient;
};

export async function writeAuditLog(input: AuditInput): Promise<void> {
  const client = input.tx ?? prisma;
  await client.auditLog.create({
    data: {
      tenantId: input.tenantId ?? null,
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
      beforeDigest: input.beforeDigest ?? null,
      afterDigest: input.afterDigest ?? null,
      metadata: input.metadata ?? {},
    },
  });
}
