"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type EditableMagazine = {
  id: string;
  magazineCode: string;
  placasCount: number;
  shift: "MORNING" | "AFTERNOON";
  magazineCapacity: number;
};

export function MagazineActions({ mag }: { mag: EditableMagazine }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  async function del() {
    if (!confirm(`¿Borrar el magazine ${mag.magazineCode}?`)) return;
    setBusy(true);
    const res = await fetch(`/api/magazines/${mag.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(typeof d.error === "string" ? d.error : "Error al borrar");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-x-1 whitespace-nowrap">
      <button className="btn-secondary" onClick={() => setEditing(true)} disabled={busy}>
        Editar
      </button>
      <button className="btn-danger" onClick={del} disabled={busy}>
        Borrar
      </button>
      {editing && (
        <EditMagazineDialog
          mag={mag}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function EditMagazineDialog({
  mag,
  onClose,
  onSaved,
}: {
  mag: EditableMagazine;
  onClose: () => void;
  onSaved: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [magazineCode, setMagazineCode] = useState(mag.magazineCode);
  const [placasCount, setPlacasCount] = useState<number | "">(mag.placasCount);
  const [shift, setShift] = useState<"MORNING" | "AFTERNOON">(mag.shift);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);

  async function save() {
    setError(null);
    setBusy(true);
    const res = await fetch(`/api/magazines/${mag.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        magazineCode: magazineCode.trim(),
        placasCount,
        shift,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(typeof d.error === "string" ? d.error : "Error al guardar");
      return;
    }
    onSaved();
  }

  return (
    <dialog ref={ref} className="rounded-lg p-0 backdrop:bg-black/40" onClose={onClose}>
      <div className="w-[400px] max-w-[95vw] space-y-4 p-6">
        <h3 className="text-lg font-semibold text-bgh-700">Editar magazine</h3>
        <div>
          <label className="label-base">Código</label>
          <input
            className="input-base"
            value={magazineCode}
            onChange={(e) => setMagazineCode(e.target.value)}
          />
        </div>
        <div>
          <label className="label-base">Paneles (cap. {mag.magazineCapacity})</label>
          <input
            type="number"
            min={1}
            max={mag.magazineCapacity}
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
