import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  ALL_ROLES,
  canEditMagazines,
  canValidateLineStop,
  type AppRole,
} from "@/lib/permissions";

export type { AppRole };
export { ALL_ROLES, canEditMagazines, canValidateLineStop };

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
