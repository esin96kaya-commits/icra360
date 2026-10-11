import { userCreateSchema } from "@icra360/contracts";
import { createUser, listUsers } from "@icra360/domain";
import { requireContext } from "@/lib/context";
import { jsonError, jsonOk } from "@/lib/http";

export async function GET() {
  try {
    const ctx = await requireContext();
    return jsonOk({ items: await listUsers(ctx) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireContext();
    const body = userCreateSchema.parse(await request.json());
    const created = await createUser(ctx, body);
    return jsonOk(created, 201);
  } catch (error) {
    return jsonError(error);
  }
}
