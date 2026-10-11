import { workplaceCreateSchema } from "@icra360/contracts";
import { createWorkplace, listWorkplaces } from "@icra360/domain";
import { requireContext } from "@/lib/context";
import { jsonError, jsonOk } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const ctx = await requireContext();
    const companyId = new URL(request.url).searchParams.get("companyId") ?? undefined;
    return jsonOk({ items: await listWorkplaces(ctx, companyId) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireContext();
    const body = workplaceCreateSchema.parse(await request.json());
    const created = await createWorkplace(ctx, body);
    return jsonOk(created, 201);
  } catch (error) {
    return jsonError(error);
  }
}
