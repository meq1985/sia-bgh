"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewStationForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/admin/stations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Error al guardar");
      return;
    }
    setName("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[200px]">
        <label className="label-base">Nombre</label>
        <input
          className="input-base"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ej. cm602-4"
          required
        />
      </div>
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Guardando..." : "Agregar"}
      </button>
      {error && (
        <div className="w-full rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
    </form>
  );
}
