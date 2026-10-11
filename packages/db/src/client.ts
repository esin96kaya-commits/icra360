import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaAdmin?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

export const prismaAdmin =
  globalForPrisma.prismaAdmin ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_MIGRATE_URL ?? process.env.DATABASE_URL,
      },
    },
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaAdmin = prismaAdmin;
}
