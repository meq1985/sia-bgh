"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Station = { id: number; name: string; active: boolean };
type Failure = {
  id: number;
  stationId: number;
  label: string;
  active: boolean;
  station: { name: string };
};

export function FailuresClient({
  stations,
  failures,
}: {
  stations: Station[];
  failures: Failure[];
}) {
  const router = useRouter();
  const [filterStation, setFilterStation] = useState<number | "">("");
  const [stationId, setStationId] = useState<number | "">(stations[0]?.id ?? "");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () => (filterStation === "" ? failures : failures.filter((f) => f.stationId === filterStation)),
    [filterStation, failures]
  );

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!stationId || !label.trim()) {
      setError("Elegí estación e ingresá la falla.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/admin/failures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stationId, label: label.trim() }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(typeof d.error === "string" ? d.error : "Error al guardar");
      return;
    }
    setLabel("");
    router.refresh();
  }

  async function patch(id: number, body: { active?: boolean; label?: string }) {
    const res = await fetch(`/api/admin/failures/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(typeof d.error === "string" ? d.error : "Error");
      return;
    }
    router.refresh();
  }

  async function del(id: number, name: string) {
    if (!confirm(`¿Eliminar "${name}"?`)) return;
    const res = await fetch(`/api/admin/failures/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(typeof d.error === "string" ? d.error : "Error");
      return;
    }
    router.refresh();
  }

  return (
    <>
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-bgh-400">Nueva falla</h2>
        <form onSubmit={add} className="card flex flex-wrap items-end gap-3">
          <div className="min-w-[160px]">
            <label className="label-base">Estación</label>
            <select
              className="input-base"
              value={stationId}
              onChange={(e) => setStationId(Number(e.target.value))}
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[240px]">
            <label className="label-base">Falla</label>
            <input
              className="input-base"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ej. Feeder vacío"
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
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-bgh-400">Listado</h2>
          <select
            className="input-base max-w-[200px]"
            value={filterStation}
            onChange={(e) =>
              setFilterStation(e.target.value === "" ? "" : Number(e.target.value))
            }
          >
            <option value="">Todas las estaciones</option>
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="card overflow-x-auto p-0">
          <table className="table-base">
            <thead>
              <tr>
                <th>Estación</th>
                <th>Falla</th>
                <th>Activa</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-bgh-400">Sin resultados.</td>
                </tr>
              )}
              {filtered.map((f) => (
                <tr key={f.id}>
                  <td>{f.station.name}</td>
                  <td className="font-medium">{f.label}</td>
                  <td>
                    <span
                      className={
                        "rounded px-2 py-0.5 text-xs font-medium " +
                        (f.active ? "bg-bgh-50 text-bgh-700" : "bg-gray-100 text-gray-600")
                      }
                    >
                      {f.active ? "Sí" : "No"}
                    </span>
                  </td>
                  <td className="space-x-2 whitespace-nowrap">
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        const next = prompt("Nueva descripción", f.label);
                        if (next && next.trim() && next.trim() !== f.label) {
                          patch(f.id, { label: next.trim() });
                        }
                      }}
                    >
                      Renombrar
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => patch(f.id, { active: !f.active })}
                    >
                      {f.active ? "Desactivar" : "Activar"}
                    </button>
                    <button className="btn-danger" onClick={() => del(f.id, f.label)}>
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
