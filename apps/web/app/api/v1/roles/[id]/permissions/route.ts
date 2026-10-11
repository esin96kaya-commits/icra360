import { rolePermissionsUpdateSchema } from "@icra360/contracts";
import { updateRolePermissions } from "@icra360/domain";
import { requireContext } from "@/lib/context";
import { jsonError, jsonOk } from "@/lib/http";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireContext();
    const { id } = await params;
    const body = rolePermissionsUpdateSchema.parse(await request.json());
    const result = await updateRolePermissions(ctx, id, body.permissionCodes);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
