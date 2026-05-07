"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReopenWoButton({ id, wo }: { id: string; wo: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function reopen() {
    if (!confirm(`¿Reabrir la WO ${wo}?`)) return;
    setLoading(true);
    const res = await fetch(`/api/wo/${id}/reopen`, { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(typeof data.error === "string" ? data.error : "Error al reabrir");
      return;
    }
    router.refresh();
  }

  return (
    <button onClick={reopen} className="btn-secondary" disabled={loading}>
      {loading ? "..." : "Reabrir"}
    </button>
  );
}
