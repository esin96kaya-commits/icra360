import { getEmployee } from "@icra360/domain";
import { requirePageContext } from "@/lib/context";
import { EmployeeEditForm } from "./form";

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePageContext();
  const { id } = await params;
  const employee = await getEmployee(ctx, id);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Personel düzenle</h1>
      <EmployeeEditForm employee={employee} />
    </div>
  );
}
