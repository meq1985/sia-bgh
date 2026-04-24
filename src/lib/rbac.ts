import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type AppRole = "ADMIN" | "SUPERVISOR" | "OPERADOR";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Response("No autenticado", { status: 401 });
  return session;
}

export async function requireRole(...allowed: AppRole[]) {
  const session = await requireSession();
  if (!allowed.includes(session.user.role)) {
    throw new Response("No autorizado", { status: 403 });
  }
  return session;
}

export function canEditMagazines(role: AppRole): boolean {
  return role === "ADMIN" || role === "SUPERVISOR";
}

export function canCloseWO(role: AppRole): boolean {
  return role === "ADMIN" || role === "SUPERVISOR" || role === "OPERADOR";
}
