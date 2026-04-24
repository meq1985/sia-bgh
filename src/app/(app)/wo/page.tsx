import { prisma } from "@/lib/db";
import { CloseWoButton } from "./close-button";

export default async function WoListPage() {
  const rows = await prisma.workOrder.findMany({
    orderBy: [{ status: "asc" }, { openedAt: "desc" }],
    include: {
      magazines: { select: { placasCount: true } },
      closedBy: { select: { fullName: true } },
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-bgh-700">Work Orders</h1>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="table-base">
          <thead>
            <tr>
              <th>WO</th>
              <th>Producto</th>
              <th>Total objetivo</th>
              <th>Cap. magazine</th>
              <th>Producido</th>
              <th>Avance</th>
              <th>Apertura</th>
              <th>Estado</th>
              <th>Cierre</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-bgh-400">
                  No hay Work Orders. Un admin debe crear una desde Gestión WO.
                </td>
              </tr>
            )}
            {rows.map((w) => {
              const produced = w.magazines.reduce((s, m) => s + m.placasCount, 0);
              const pct = w.totalQty > 0 ? Math.min(100, Math.round((produced / w.totalQty) * 100)) : 0;
              return (
                <tr key={w.id}>
                  <td className="font-medium">{w.woNumber}</td>
                  <td>{w.productCode}</td>
                  <td className="text-right">{w.totalQty}</td>
                  <td className="text-right">{w.magazineCapacity}</td>
                  <td className="text-right">{produced}</td>
                  <td className="min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-full bg-bgh-50 rounded">
                        <div
                          className="h-2 rounded bg-bgh-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-bgh-700 w-10 text-right">{pct}%</span>
                    </div>
                  </td>
                  <td className="text-xs">{w.openedAt.toLocaleString("es-AR")}</td>
                  <td>
                    <span
                      className={
                        "rounded px-2 py-0.5 text-xs font-medium " +
                        (w.status === "OPEN"
                          ? "bg-bgh-50 text-bgh-700"
                          : "bg-gray-100 text-gray-600")
                      }
                    >
                      {w.status === "OPEN" ? "Abierta" : "Cerrada"}
                    </span>
                  </td>
                  <td className="text-xs">
                    {w.closedAt ? (
                      <>
                        {w.closedAt.toLocaleString("es-AR")}<br />
                        <span className="text-bgh-400">{w.closedBy?.fullName}</span>
                      </>
                    ) : "—"}
                  </td>
                  <td>{w.status === "OPEN" && <CloseWoButton id={w.id} wo={w.woNumber} />}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
