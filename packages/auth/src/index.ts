import argon2 from "argon2";
import { prismaAdmin } from "@icra360/db";
import { writeAuditLog } from "@icra360/audit";

export type AuthenticatedUser = {
  id: string;
  tenantId: string;
  email: string;
  name: string;
};

export async function authenticateWithPassword(
  email: string,
  password: string,
  meta?: { ip?: string; userAgent?: string },
): Promise<AuthenticatedUser | null> {
  const normalized = email.trim().toLowerCase();
  const matches = await prismaAdmin.user.findMany({
    where: { email: normalized, deletedAt: null, status: { in: ["ACTIVE", "INVITED"] } },
    take: 2,
  });

  if (matches.length !== 1) {
    await writeAuditLog({
      action: "login.failure",
      entityType: "User",
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      metadata: { reason: matches.length > 1 ? "ambiguous" : "unknown" },
      tx: prismaAdmin,
    });
    return null;
  }

  const user = matches[0];
  if (!user) {
    return null;
  }

  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) {
    await writeAuditLog({
      tenantId: user.tenantId,
      actorId: user.id,
      action: "login.failure",
      entityType: "User",
      entityId: user.id,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
      tx: prismaAdmin,
    });
    return null;
  }

  await prismaAdmin.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), status: "ACTIVE" },
  });

  await writeAuditLog({
    tenantId: user.tenantId,
    actorId: user.id,
    action: "login.success",
    entityType: "User",
    entityId: user.id,
    ip: meta?.ip,
    userAgent: meta?.userAgent,
    tx: prismaAdmin,
  });

  return {
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    name: user.name,
  };
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}
