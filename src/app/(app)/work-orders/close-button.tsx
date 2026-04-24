"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CloseWoButton({ id, wo }: { id: string; wo: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function close() {
    if (!confirm(`¿Cerrar la WO ${wo}? Esta acción impide cargar más magazines.`)) return;
    setLoading(true);
    const res = await fetch(`/api/wo/${id}/close`, { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(typeof data.error === "string" ? data.error : "Error al cerrar");
      return;
    }
    router.refresh();
  }

  return (
    <button onClick={close} className="btn-danger" disabled={loading}>
      {loading ? "Cerrando..." : "Cerrar WO"}
    </button>
  );
}
