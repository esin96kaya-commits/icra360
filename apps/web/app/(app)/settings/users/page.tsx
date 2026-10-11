import { listCompanies, listRoles, listUsers } from "@icra360/domain";
import { Card } from "@/components/ui/card";
import { requirePageContext } from "@/lib/context";
import { UserCreateForm } from "./form";

export default async function UsersPage() {
  const ctx = await requirePageContext();
  const [users, roles, companies] = await Promise.all([listUsers(ctx), listRoles(ctx), listCompanies(ctx)]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Kullanıcılar</h1>
      <UserCreateForm
        roles={roles.map((role) => ({ code: role.code, name: role.name }))}
        companies={companies.map((company) => ({ id: company.id, legalName: company.legalName }))}
      />
      <div className="grid gap-3">
        {users.map((user) => (
          <Card key={user.id}>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-navy/70">{user.email}</p>
            <p className="text-xs text-navy/70">
              {user.roles.map((assignment) => assignment.role.name).join(", ")} · {user.status}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
