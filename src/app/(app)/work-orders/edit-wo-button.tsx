"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Line = { id: number; name: string };

export type EditableWo = {
  id: string;
  woNumber: string;
  productCode: string;
  totalQty: number;
  dailyTargetQty: number;
  magazineCapacity: number;
  smdLineId: number;
  hasMagazines: boolean;
};

export function EditWoButton({ wo, lines }: { wo: EditableWo; lines: Line[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-secondary" onClick={() => setOpen(true)}>
        Editar
      </button>
      {open && <EditWoDialog wo={wo} lines={lines} onClose={() => setOpen(false)} />}
    </>
  );
}

function EditWoDialog({
  wo,
  lines,
  onClose,
}: {
  wo: EditableWo;
  lines: Line[];
  onClose: () => void;
}) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [woNumber, setWoNumber] = useState(wo.woNumber);
  const [productCode, setProductCode] = useState(wo.productCode);
  const [totalQty, setTotalQty] = useState<number | "">(wo.totalQty);
  const [dailyTargetQty, setDailyTargetQty] = useState<number | "">(wo.dailyTargetQty);
  const [magazineCapacity, setMagazineCapacity] = useState<17 | 25 | 50>(
    wo.magazineCapacity as 17 | 25 | 50,
  );
  const [smdLineId, setSmdLineId] = useState<number | "">(wo.smdLineId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);

  async function save() {
    setError(null);
    setBusy(true);
    const body: Record<string, unknown> = {
      productCode: productCode.trim(),
      totalQty,
      dailyTargetQty: dailyTargetQty === "" ? 0 : dailyTargetQty,
      magazineCapacity,
    };
    if (!wo.hasMagazines) {
      body.woNumber = woNumber.trim();
      body.smdLineId = smdLineId;
    }
    const res = await fetch(`/api/wo/${wo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(typeof d.error === "string" ? d.error : "Error al guardar");
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <dialog
      ref={ref}
      className="rounded-lg p-0 backdrop:bg-black/40"
      onClose={onClose}
    >
      <div className="w-[480px] max-w-[95vw] space-y-4 p-6">
        <div>
          <h3 className="text-lg font-semibold text-bgh-700">Editar WO {wo.woNumber}</h3>
          {wo.hasMagazines && (
            <p className="text-xs text-amber-700">
              La WO tiene magazines cargados. Solo se pueden editar campos seguros.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label-base">Número de WO</label>
            <input
              className="input-base"
              value={woNumber}
              onChange={(e) => setWoNumber(e.target.value)}
              disabled={wo.hasMagazines}
            />
          </div>
          <div className="col-span-2">
            <label className="label-base">Código de producto</label>
            <input
              className="input-base"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
            />
          </div>
          <div>
            <label className="label-base">Línea</label>
            <select
              className="input-base"
              value={smdLineId}
              onChange={(e) => setSmdLineId(Number(e.target.value))}
              disabled={wo.hasMagazines}
            >
              {lines.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-base">Capacidad</label>
            <select
              className="input-base"
              value={magazineCapacity}
              onChange={(e) => setMagazineCapacity(Number(e.target.value) as 17 | 25 | 50)}
            >
              <option value={17}>17</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div>
            <label className="label-base">Cantidad total</label>
            <input
              type="number"
              min={1}
              className="input-base"
              value={totalQty}
              onChange={(e) => setTotalQty(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label-base">Target diario</label>
            <input
              type="number"
              min={0}
              className="input-base"
              value={dailyTargetQty}
              onChange={(e) =>
                setDailyTargetQty(e.target.value === "" ? "" : Number(e.target.value))
              }
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-secondary" disabled={busy}>
            Cancelar
          </button>
          <button onClick={save} className="btn-primary" disabled={busy}>
            {busy ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
