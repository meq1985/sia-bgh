"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteWoButton({ id, wo }: { id: string; wo: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  async function del() {
    if (!confirm(`¿Eliminar la WO ${wo}?`)) return;
    setLoading(true);
    const res = await fetch(`/api/wo/${id}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(typeof data.error === "string" ? data.error : "Error");
      return;
    }
    router.refresh();
  }
  return (
    <button className="btn-danger" onClick={del} disabled={loading}>
      {loading ? "..." : "Borrar"}
    </button>
  );
}
