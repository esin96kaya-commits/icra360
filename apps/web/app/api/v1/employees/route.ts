import { NextResponse } from "next/server";
import { paginationQuerySchema } from "@icra360/contracts";
import { listEmployees } from "@icra360/domain";
import { requireContext } from "@/lib/context";
import { jsonError, jsonOk } from "@/lib/http";
import { employeeCreateSchema } from "@icra360/contracts";
import { createEmployee } from "@icra360/domain";

export async function GET(request: Request) {
  try {
    const ctx = await requireContext();
    const url = new URL(request.url);
    const query = paginationQuerySchema.parse({
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
      q: url.searchParams.get("q") ?? undefined,
    });
    const result = await listEmployees(ctx, query);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireContext();
    const body = employeeCreateSchema.parse(await request.json());
    const created = await createEmployee(ctx, {
      ...body,
      employment: {
        ...body.employment,
        workplaceId: body.employment.workplaceId ?? null,
        endDate: body.employment.endDate ?? null,
        terminationCode: body.employment.terminationCode ?? null,
        netSalary: body.employment.netSalary ?? null,
      },
    });
    return jsonOk(created, 201);
  } catch (error) {
    return jsonError(error);
  }
}

export function OPTIONS() {
  return NextResponse.json(null, { status: 204 });
}
