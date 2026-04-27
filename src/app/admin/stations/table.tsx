"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Row = {
  id: number;
  name: string;
  active: boolean;
  _count: { failures: number; lineStops: number };
};

export function StationsTable({ rows }: { rows: Row[] }) {
  return (
    <div className="card overflow-x-auto p-0">
      <table className="table-base">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Activa</th>
            <th>Fallas</th>
            <th>Paradas</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-bgh-400">Sin estaciones.</td>
            </tr>
          )}
          {rows.map((r) => (
            <StationRow key={r.id} row={r} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StationRow({ row }: { row: Row }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function patch(body: { active?: boolean; name?: string }) {
    setBusy(true);
    const res = await fetch(`/api/admin/stations/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(typeof d.error === "string" ? d.error : "Error");
      return;
    }
    router.refresh();
  }

  async function rename() {
    const next = prompt("Nuevo nombre", row.name);
    if (!next || next.trim() === row.name) return;
    await patch({ name: next.trim() });
  }

  async function del() {
    if (!confirm(`¿Eliminar "${row.name}"?`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/stations/${row.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(typeof d.error === "string" ? d.error : "Error");
      return;
    }
    router.refresh();
  }

  return (
    <tr>
      <td className="font-medium">{row.name}</td>
      <td>
        <span
          className={
            "rounded px-2 py-0.5 text-xs font-medium " +
            (row.active ? "bg-bgh-50 text-bgh-700" : "bg-gray-100 text-gray-600")
          }
        >
          {row.active ? "Sí" : "No"}
        </span>
      </td>
      <td className="text-right">{row._count.failures}</td>
      <td className="text-right">{row._count.lineStops}</td>
      <td className="space-x-2 whitespace-nowrap">
        <button className="btn-secondary" onClick={rename} disabled={busy}>
          Renombrar
        </button>
        <button
          className="btn-secondary"
          onClick={() => patch({ active: !row.active })}
          disabled={busy}
        >
          {row.active ? "Desactivar" : "Activar"}
        </button>
        {row._count.lineStops === 0 && (
          <button className="btn-danger" onClick={del} disabled={busy}>
            Borrar
          </button>
        )}
      </td>
    </tr>
  );
}
