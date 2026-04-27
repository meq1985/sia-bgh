"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AppRole } from "@/lib/rbac";

export function NewUserForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("OPERADOR");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), fullName: fullName.trim(), password, role }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Error al crear usuario");
      return;
    }
    router.push("/admin/users");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <div>
        <label className="label-base">Usuario</label>
        <input className="input-base" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <p className="text-xs text-bgh-400 mt-1">3-32 caracteres. Letras, números, punto, guion, guion bajo.</p>
      </div>
      <div>
        <label className="label-base">Nombre completo</label>
        <input className="input-base" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>
      <div>
        <label className="label-base">Contraseña inicial</label>
        <input type="password" className="input-base" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
      </div>
      <div>
        <label className="label-base">Rol</label>
        <select className="input-base" value={role} onChange={(e) => setRole(e.target.value as AppRole)}>
          <option value="OPERADOR">Operador</option>
          <option value="SUPERVISOR">Supervisor</option>
          <option value="MANTENIMIENTO">Mantenimiento</option>
          <option value="PROGRAMACION">Programación</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </div>
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => router.back()} className="btn-secondary">Cancelar</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Creando..." : "Crear usuario"}
        </button>
      </div>
    </form>
  );
}
