"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type User = {
  id: string;
  username: string;
  fullName: string;
  role: "ADMIN" | "SUPERVISOR" | "OPERADOR";
  active: boolean;
};

export function UserRowActions({ user }: { user: User }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function patch(payload: Record<string, unknown>) {
    setBusy(true);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(typeof data.error === "string" ? data.error : "Error");
      return;
    }
    router.refresh();
  }

  async function toggleActive() {
    await patch({ active: !user.active });
  }

  async function changeRole(e: React.ChangeEvent<HTMLSelectElement>) {
    await patch({ role: e.target.value });
  }

  async function resetPassword() {
    const p = prompt(`Nueva contraseña para ${user.username} (mínimo 6 caracteres):`);
    if (!p) return;
    if (p.length < 6) { alert("Mínimo 6 caracteres"); return; }
    await patch({ password: p });
    alert("Contraseña actualizada");
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="input-base py-1 text-xs w-32"
        value={user.role}
        onChange={changeRole}
        disabled={busy}
      >
        <option value="OPERADOR">OPERADOR</option>
        <option value="SUPERVISOR">SUPERVISOR</option>
        <option value="ADMIN">ADMIN</option>
      </select>
      <button onClick={toggleActive} disabled={busy} className="btn-secondary py-1 text-xs">
        {user.active ? "Desactivar" : "Activar"}
      </button>
      <button onClick={resetPassword} disabled={busy} className="btn-secondary py-1 text-xs">
        Reset pass
      </button>
    </div>
  );
}
