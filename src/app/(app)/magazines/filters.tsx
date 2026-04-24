"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Line = { id: number; name: string };
type WO = { id: string; woNumber: string; productCode: string; status: string };

export function MagazinesFilters({
  lines,
  workOrders,
  initial,
}: {
  lines: Line[];
  workOrders: WO[];
  initial: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [wo, setWo] = useState(initial.workOrderId ?? "");
  const [line, setLine] = useState(initial.smdLineId ?? "");
  const [shift, setShift] = useState(initial.shift ?? "");
  const [from, setFrom] = useState(initial.from ?? "");
  const [to, setTo] = useState(initial.to ?? "");

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries({ workOrderId: wo, smdLineId: line, shift, from, to })) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    router.push(`/magazines?${p.toString()}`);
  }

  function reset() {
    setWo(""); setLine(""); setShift(""); setFrom(""); setTo("");
    router.push("/magazines");
  }

  return (
    <form onSubmit={apply} className="card grid grid-cols-1 gap-3 md:grid-cols-6">
      <div className="md:col-span-2">
        <label className="label-base">Work Order</label>
        <select className="input-base" value={wo} onChange={(e) => setWo(e.target.value)}>
          <option value="">Todas</option>
          {workOrders.map((w) => (
            <option key={w.id} value={w.id}>
              {w.woNumber} · {w.productCode} {w.status === "CLOSED" ? "(cerrada)" : ""}
            </option>
          ))}
        </select>
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
        <label className="label-base">Turno</label>
        <select className="input-base" value={shift} onChange={(e) => setShift(e.target.value)}>
          <option value="">Todos</option>
          <option value="MORNING">Mañana</option>
          <option value="AFTERNOON">Tarde</option>
        </select>
      </div>
      <div>
        <label className="label-base">Desde</label>
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
