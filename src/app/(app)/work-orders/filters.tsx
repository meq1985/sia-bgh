"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Line = { id: number; name: string };

export function WorkOrdersFilters({
  lines,
  initial,
}: {
  lines: Line[];
  initial: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(initial.q ?? "");
  const [line, setLine] = useState(initial.smdLineId ?? "");
  const [status, setStatus] = useState(initial.status ?? "");
  const [from, setFrom] = useState(initial.from ?? "");
  const [to, setTo] = useState(initial.to ?? "");

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries({
      q: q.trim(),
      smdLineId: line,
      status,
      from,
      to,
    })) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    router.push(`/work-orders?${p.toString()}`);
  }

  function reset() {
    setQ(""); setLine(""); setStatus(""); setFrom(""); setTo("");
    router.push("/work-orders");
  }

  return (
    <form onSubmit={apply} className="card grid grid-cols-1 gap-3 md:grid-cols-6">
      <div className="md:col-span-2">
        <label className="label-base">Buscar (WO o producto)</label>
        <input
          className="input-base"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ej. WO-001 o BGH-1234"
        />
      </div>
      <div>
        <label className="label-base">Línea</label>
        <select className="input-base" value={line} onChange={(e) => setLine(e.target.value)}>
          <option value="">Todas</option>
          {lines.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label-base">Estado</label>
        <select className="input-base" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos</option>
          <option value="OPEN">Abiertas</option>
          <option value="CLOSED">Cerradas</option>
        </select>
      </div>
      <div>
        <label className="label-base">Apertura desde</label>
        <input type="date" className="input-base" value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <div>
        <label className="label-base">Hasta</label>
        <input type="date" className="input-base" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <div className="md:col-span-6 flex gap-2 justify-end">
        <button type="button" onClick={reset} className="btn-secondary">Limpiar</button>
        <button type="submit" className="btn-primary">Filtrar</button>
      </div>
    </form>
  );
}
