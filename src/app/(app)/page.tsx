import { redirect } from "next/navigation";
import { requireSession } from "@/lib/rbac";

export default async function Home() {
  const session = await requireSession();
  const role = session.user.role;
  if (role === "MANTENIMIENTO" || role === "PROGRAMACION") {
    redirect("/paradas");
  }
  redirect("/magazines");
}
