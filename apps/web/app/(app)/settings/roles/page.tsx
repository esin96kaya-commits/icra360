import { listPermissions, listRoles } from "@icra360/domain";
import { requirePageContext } from "@/lib/context";
import { RolePermissionForm } from "./form";

export default async function RolesPage() {
  const ctx = await requirePageContext();
  const [roles, permissions] = await Promise.all([listRoles(ctx), listPermissions(ctx)]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Roller ve izinler</h1>
        <p className="text-sm text-navy/70">Sistem rolleri silinemez; izin kümeleri özelleştirilebilir.</p>
      </div>
      {roles.map((role) => (
        <RolePermissionForm
          key={role.id}
          roleId={role.id}
          roleName={role.name}
          selected={role.permissions.map((item) => item.permission.code)}
          permissions={permissions.map((permission) => permission.code)}
        />
      ))}
    </div>
  );
}
