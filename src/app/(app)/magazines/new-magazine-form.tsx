"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { defaultShiftForNow } from "@/lib/shift";

type Line = { id: number; name: string };
type WO = {
  id: string;
  woNumber: string;
  productCode: string;
  magazineCapacity: number;
  totalQty: number;
  smdLineId: number;
};

export function NewMagazineForm({
  lines,
  workOrders,
}: {
  lines: Line[];
  workOrders: WO[];
}) {
  const router = useRouter();
  const [smdLineId, setSmdLineId] = useState<number | "">(lines[0]?.id ?? "");
  const filteredWOs = useMemo(
    () => (smdLineId === "" ? [] : workOrders.filter((w) => w.smdLineId === smdLineId)),
    [smdLineId, workOrders]
  );
  const [workOrderId, setWorkOrderId] = useState<string>(filteredWOs[0]?.id ?? "");
  const [magazineCode, setMagazineCode] = useState("");
  const [placasCount, setPlacasCount] = useState<number | "">("");
  const [shift, setShift] = useState(defaultShiftForNow());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedWO = useMemo(
    () => filteredWOs.find((w) => w.id === workOrderId),
    [workOrderId, filteredWOs]
  );

  function onLineChange(next: number) {
    setSmdLineId(next);
    const first = workOrders.find((w) => w.smdLineId === next);
    setWorkOrderId(first?.id ?? "");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!smdLineId || !workOrderId || !magazineCode || !placasCount) {
      setError("Completá todos los campos.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/magazines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workOrderId,
        smdLineId,
        magazineCode: magazineCode.trim(),
        placasCount,
        shift,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Error al guardar.");
      return;
    }
    setMagazineCode("");
    setPlacasCount("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="label-base">Línea SMD</label>
          <select
            className="input-base"
            value={smdLineId}
            onChange={(e) => onLineChange(Number(e.target.value))}
          >
            {lines.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-base">Work Order</label>
          {filteredWOs.length === 0 ? (
            <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
              No hay WO abiertas con cupo para esta línea.
            </div>
          ) : (
            <select
              className="input-base"
              value={workOrderId}
              onChange={(e) => setWorkOrderId(e.target.value)}
            >
              {filteredWOs.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.woNumber} · {w.productCode} (cap. {w.magazineCapacity}, total {w.totalQty})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <label className="label-base">Código de magazine</label>
          <input
            className="input-base"
            value={magazineCode}
            onChange={(e) => setMagazineCode(e.target.value)}
            placeholder="ej. MG-001"
          />
        </div>
        <div>
          <label className="label-base">
            Placas {selectedWO && (
              <span className="text-bgh-400 font-normal">(máx {selectedWO.magazineCapacity})</span>
            )}
          </label>
          <input
            type="number"
            min={1}
            max={selectedWO?.magazineCapacity ?? undefined}
            className="input-base"
            value={placasCount}
            onChange={(e) => setPlacasCount(e.target.value === "" ? "" : Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label-base">Turno</label>
          <select
            className="input-base"
            value={shift}
            onChange={(e) => setShift(e.target.value as "MORNING" | "AFTERNOON")}
          >
            <option value="MORNING">Mañana</option>
            <option value="AFTERNOON">Tarde</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          className="btn-primary"
          disabled={loading || filteredWOs.length === 0}
        >
          {loading ? "Guardando..." : "Guardar magazine"}
        </button>
      </div>
    </form>
  );
}
