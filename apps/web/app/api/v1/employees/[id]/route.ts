import { employeeUpdateSchema } from "@icra360/contracts";
import { getEmployee, updateEmployee } from "@icra360/domain";
import { requireContext } from "@/lib/context";
import { jsonError, jsonOk } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const ctx = await requireContext();
    const { id } = await params;
    const url = new URL(request.url);
    const reveal = url.searchParams.get("reveal") === "1";
    const employee = await getEmployee(ctx, id, { revealSensitive: reveal });
    return jsonOk(employee);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const ctx = await requireContext();
    const { id } = await params;
    const body = employeeUpdateSchema.parse(await request.json());
    const updated = await updateEmployee(ctx, id, body);
    return jsonOk(updated);
  } catch (error) {
    return jsonError(error);
  }
}
