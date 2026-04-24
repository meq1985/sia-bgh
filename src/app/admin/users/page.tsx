import Link from "next/link";
import { prisma } from "@/lib/db";
import { UserRowActions } from "./actions";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
    select: { id: true, username: true, fullName: true, role: true, active: true, createdAt: true },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-bgh-700">Usuarios</h1>
        <Link className="btn-primary" href="/admin/users/new">Nuevo usuario</Link>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="table-base">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Alta</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="font-medium">{u.username}</td>
                <td>{u.fullName}</td>
                <td>{u.role}</td>
                <td>
                  <span className={u.active ? "text-bgh-700" : "text-red-600"}>
                    {u.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="text-xs">{u.createdAt.toLocaleDateString("es-AR")}</td>
                <td><UserRowActions user={u} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
