import { listRoles } from "@icra360/domain";
import { requireContext } from "@/lib/context";
import { jsonError, jsonOk } from "@/lib/http";

export async function GET() {
  try {
    const ctx = await requireContext();
    return jsonOk({ items: await listRoles(ctx) });
  } catch (error) {
    return jsonError(error);
  }
}
