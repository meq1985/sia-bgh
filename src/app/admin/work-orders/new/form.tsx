"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewWoForm() {
  const router = useRouter();
  const [woNumber, setWoNumber] = useState("");
  const [productCode, setProductCode] = useState("");
  const [totalQty, setTotalQty] = useState<number | "">("");
  const [magazineCapacity, setMagazineCapacity] = useState<17 | 25 | 50>(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/wo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        woNumber: woNumber.trim(),
        productCode: productCode.trim(),
        totalQty,
        magazineCapacity,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Error al guardar");
      return;
    }
    router.push("/admin/work-orders");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <div>
        <label className="label-base">Número de WO</label>
        <input className="input-base" value={woNumber} onChange={(e) => setWoNumber(e.target.value)} required />
      </div>
      <div>
        <label className="label-base">Código de producto</label>
        <input className="input-base" value={productCode} onChange={(e) => setProductCode(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-base">Cantidad total de placas</label>
          <input
            type="number"
            min={1}
            className="input-base"
            value={totalQty}
            onChange={(e) => setTotalQty(e.target.value === "" ? "" : Number(e.target.value))}
            required
          />
        </div>
        <div>
          <label className="label-base">Capacidad del magazine</label>
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
      </div>
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => router.back()} className="btn-secondary">Cancelar</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Guardando..." : "Crear WO"}
        </button>
      </div>
    </form>
  );
}
