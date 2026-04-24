import { prisma } from "@/lib/db";
import Link from "next/link";
import { DeleteWoButton } from "./delete-button";

export default async function AdminWoPage() {
  const rows = await prisma.workOrder.findMany({
    orderBy: { openedAt: "desc" },
    include: { _count: { select: { magazines: true } } },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-bgh-700">Gestión de Work Orders</h1>
        <Link className="btn-primary" href="/admin/work-orders/new">Nueva WO</Link>
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="table-base">
          <thead>
            <tr>
              <th>WO</th>
              <th>Producto</th>
              <th>Total</th>
              <th>Cap.</th>
              <th>Apertura</th>
              <th>Estado</th>
              <th>Magazines</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.id}>
                <td className="font-medium">{w.woNumber}</td>
                <td>{w.productCode}</td>
                <td className="text-right">{w.totalQty}</td>
                <td className="text-right">{w.magazineCapacity}</td>
                <td className="text-xs">{w.openedAt.toLocaleString("es-AR")}</td>
                <td>{w.status === "OPEN" ? "Abierta" : "Cerrada"}</td>
                <td className="text-right">{w._count.magazines}</td>
                <td>
                  {w._count.magazines === 0 && <DeleteWoButton id={w.id} wo={w.woNumber} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
