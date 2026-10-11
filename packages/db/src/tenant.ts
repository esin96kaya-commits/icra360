import type { Prisma } from "@prisma/client";
import { prisma } from "./client.js";

export async function withTenant<T>(
  tenantId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}::text, true)`;
    return fn(tx);
  });
}
