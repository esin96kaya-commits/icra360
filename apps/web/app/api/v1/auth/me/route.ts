import { canReadSensitive, hasPermission } from "@icra360/domain";
import { requireContext } from "@/lib/context";
import { jsonError, jsonOk } from "@/lib/http";

export async function GET() {
  try {
    const ctx = await requireContext();
    return jsonOk({
      id: ctx.userId,
      tenantId: ctx.tenantId,
      email: ctx.email,
      name: ctx.name,
      permissions: ctx.permissionCodes,
      companyScopeIds: ctx.companyScopeIds,
      canReadSensitive: canReadSensitive(ctx),
      canWriteEmployees: hasPermission(ctx, "employee:write"),
    });
  } catch (error) {
    return jsonError(error);
  }
}
