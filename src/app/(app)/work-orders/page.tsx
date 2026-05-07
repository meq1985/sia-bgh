import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/rbac";
import { isWoComplete, producedFromMagazines } from "@/lib/wo";
import { NewWoForm } from "./new-wo-form";
import { CloseWoButton } from "./close-button";
import { DeleteWoButton } from "./delete-button";
import { ReopenWoButton } from "./reopen-button";
import { EditWoButton } from "./edit-wo-button";
import { WorkOrdersFilters } from "./filters";

type SearchParams = Promise<{
  q?: string;
  smdLineId?: string;
  status?: string;
  from?: string;
  to?: string;
}>;

export default async function WorkOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requireSession();
  const role = session.user.role;
  if (role === "OPERADOR") redirect("/magazines");

  const sp = await searchParams;
  const where: Record<string, unknown> = {};
  if (sp.smdLineId) where.smdLineId = Number(sp.smdLineId);
  if (sp.status === "OPEN" || sp.status === "CLOSED") where.status = sp.status;
  if (sp.q) {
    const q = sp.q.trim();
    if (q) {
      where.OR = [
        { woNumber: { contains: q, mode: "insensitive" } },
        { productCode: { contains: q, mode: "insensitive" } },
      ];
    }
  }
  if (sp.from || sp.to) {
    const range: { gte?: Date; lte?: Date } = {};
    if (sp.from) range.gte = new Date(sp.from);
    if (sp.to) {
      const d = new Date(sp.to);
      d.setHours(23, 59, 59, 999);
      range.lte = d;
    }
    where.openedAt = range;
  }

  const [rows, lines] = await Promise.all([
    prisma.workOrder.findMany({
      where,
      orderBy: [{ status: "asc" }, { openedAt: "desc" }],
      include: {
        smdLine: { select: { name: true } },
        magazines: { select: { placasCount: true } },
        closedBy: { select: { fullName: true } },
        _count: { select: { magazines: true } },
      },
    }),
    prisma.smdLine.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  const canManage = role === "ADMIN" || role === "SUPERVISOR";
  const hasFilters = Object.values(sp).some((v) => v && String(v).trim() !== "");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-bgh-700">Work Orders</h1>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-bgh-400">Nueva WO</h2>
        <NewWoForm lines={lines} />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-bgh-400">Filtros</h2>
        <WorkOrdersFilters lines={lines} initial={sp} />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-bgh-400">Listado</h2>
        <div className="card overflow-x-auto p-0">
          <table className="table-base">
            <thead>
              <tr>
                <th>WO</th>
                <th>Línea</th>
                <th>Producto</th>
                <th>Total</th>
                <th>Target diario</th>
                <th>Cap.</th>
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
                  <td colSpan={12} className="py-8 text-center text-bgh-400">
                    {hasFilters
                      ? "Sin resultados para los filtros aplicados."
                      : "No hay Work Orders. Creá la primera usando el formulario de arriba."}
                  </td>
                </tr>
              )}
              {rows.map((w) => {
                const produced = producedFromMagazines(w.magazines);
                const pct = w.totalQty > 0 ? Math.min(100, Math.round((produced / w.totalQty) * 100)) : 0;
                const canReopen =
                  w.status === "CLOSED" && !isWoComplete(produced, w.totalQty);
                return (
                  <tr key={w.id}>
                    <td className="font-medium">{w.woNumber}</td>
                    <td>{w.smdLine.name}</td>
                    <td>{w.productCode}</td>
                    <td className="text-right">{w.totalQty}</td>
                    <td className="text-right">{w.dailyTargetQty || "—"}</td>
                    <td className="text-right">{w.magazineCapacity}</td>
                    <td className="text-right">{produced}</td>
                    <td className="min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-full bg-bgh-50 rounded">
                          <div className="h-2 rounded bg-bgh-700" style={{ width: `${pct}%` }} />
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
                    <td className="space-x-2 whitespace-nowrap">
                      {canManage && (
                        <EditWoButton
                          wo={{
                            id: w.id,
                            woNumber: w.woNumber,
                            productCode: w.productCode,
                            totalQty: w.totalQty,
                            dailyTargetQty: w.dailyTargetQty,
                            magazineCapacity: w.magazineCapacity,
                            smdLineId: w.smdLineId,
                            hasMagazines: w._count.magazines > 0,
                          }}
                          lines={lines}
                        />
                      )}
                      {w.status === "OPEN" && <CloseWoButton id={w.id} wo={w.woNumber} />}
                      {canManage && canReopen && (
                        <ReopenWoButton id={w.id} wo={w.woNumber} />
                      )}
                      {canManage && w._count.magazines === 0 && (
                        <DeleteWoButton id={w.id} wo={w.woNumber} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
