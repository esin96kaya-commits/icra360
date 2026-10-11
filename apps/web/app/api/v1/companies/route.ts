import { companyCreateSchema } from "@icra360/contracts";
import { createCompany, listCompanies } from "@icra360/domain";
import { requireContext } from "@/lib/context";
import { jsonError, jsonOk } from "@/lib/http";

export async function GET() {
  try {
    const ctx = await requireContext();
    return jsonOk({ items: await listCompanies(ctx) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireContext();
    const body = companyCreateSchema.parse(await request.json());
    const created = await createCompany(ctx, body);
    return jsonOk(created, 201);
  } catch (error) {
    return jsonError(error);
  }
}
