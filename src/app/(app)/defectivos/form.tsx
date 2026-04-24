"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { defaultShiftForNow } from "@/lib/shift";

type Line = { id: number; name: string };
type WO = { id: string; woNumber: string; productCode: string; status: string };

function todayIso() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export function NewDefectiveForm({ lines, workOrders }: { lines: Line[]; workOrders: WO[] }) {
  const router = useRouter();
  const [reportDate, setReportDate] = useState(todayIso());
  const [shift, setShift] = useState(defaultShiftForNow());
  const [smdLineId, setSmdLineId] = useState<number | "">(lines[0]?.id ?? "");
  const [workOrderId, setWorkOrderId] = useState(workOrders[0]?.id ?? "");
  const [defectiveQty, setDefectiveQty] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setOk(false);
    if (!smdLineId || !workOrderId || defectiveQty === "") {
      setError("Completá todos los campos.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/defectivos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportDate, shift, smdLineId, workOrderId, defectiveQty }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Error al guardar");
      return;
    }
    setOk(true);
    setDefectiveQty("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card grid grid-cols-1 gap-3 md:grid-cols-5">
      <div>
        <label className="label-base">Fecha</label>
        <input type="date" className="input-base" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
      </div>
      <div>
        <label className="label-base">Turno</label>
        <select className="input-base" value={shift} onChange={(e) => setShift(e.target.value as "MORNING" | "AFTERNOON")}>
          <option value="MORNING">Mañana</option>
          <option value="AFTERNOON">Tarde</option>
        </select>
      </div>
      <div>
        <label className="label-base">Línea</label>
        <select className="input-base" value={smdLineId} onChange={(e) => setSmdLineId(Number(e.target.value))}>
          {lines.map((l) => (<option key={l.id} value={l.id}>{l.name}</option>))}
        </select>
      </div>
      <div>
        <label className="label-base">Work Order</label>
        <select className="input-base" value={workOrderId} onChange={(e) => setWorkOrderId(e.target.value)}>
          {workOrders.map((w) => (
            <option key={w.id} value={w.id}>
              {w.woNumber} · {w.productCode} {w.status === "CLOSED" ? "(cerrada)" : ""}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label-base">Defectuosas</label>
        <input
          type="number" min={0} className="input-base"
          value={defectiveQty}
          onChange={(e) => setDefectiveQty(e.target.value === "" ? "" : Number(e.target.value))}
        />
      </div>
      {error && (
        <div className="md:col-span-5 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      {ok && (
        <div className="md:col-span-5 rounded-md bg-bgh-50 border border-bgh-200 px-3 py-2 text-sm text-bgh-800">Reporte guardado.</div>
      )}
      <div className="md:col-span-5 flex justify-end">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Guardando..." : "Registrar defectuosas"}
        </button>
      </div>
    </form>
  );
}
