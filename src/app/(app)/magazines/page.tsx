import { prisma } from "@/lib/db";
import { cumulativeByMagazine } from "@/lib/cumulative";
import { requireSession } from "@/lib/rbac";
import { isWoComplete, producedPlacasFromMagazines } from "@/lib/wo";
import { MagazinesFilters } from "./filters";
import { MagazineActions } from "./magazine-actions";
import { NewMagazineForm } from "./new-magazine-form";

type SearchParams = Promise<{
  workOrderId?: string;
  smdLineId?: string;
  shift?: string;
  from?: string;
  to?: string;
}>;

export default async function MagazinesPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await requireSession();
  const role = session.user.role;
  const canManage = role === "ADMIN" || role === "SUPERVISOR";
  const sp = await searchParams;
  const where: Record<string, unknown> = {};
  if (sp.workOrderId) where.workOrderId = sp.workOrderId;
  if (sp.smdLineId) where.smdLineId = Number(sp.smdLineId);
  if (sp.shift === "MORNING" || sp.shift === "AFTERNOON") where.shift = sp.shift;
  if (sp.from || sp.to) {
    const range: { gte?: Date; lte?: Date } = {};
    if (sp.from) range.gte = new Date(sp.from);
    if (sp.to) {
      const d = new Date(sp.to);
      d.setHours(23, 59, 59, 999);
      range.lte = d;
    }
    where.createdAt = range;
  }

  const [rows, lines, openWOs, openWOsWithMags] = await Promise.all([
    prisma.magazine.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        workOrder: {
          select: { woNumber: true, productCode: true, magazineCapacity: true, troquel: true },
        },
        smdLine: { select: { name: true } },
        createdBy: { select: { username: true, fullName: true } },
      },
    }),
    prisma.smdLine.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.workOrder.findMany({ orderBy: { openedAt: "desc" }, take: 200 }),
    prisma.workOrder.findMany({
      where: { status: "OPEN" },
      orderBy: { openedAt: "desc" },
      select: {
        id: true,
        woNumber: true,
        productCode: true,
        magazineCapacity: true,
        troquel: true,
        totalQty: true,
        smdLineId: true,
        magazines: { select: { placasCount: true } },
      },
    }),
  ]);

  const eligibleWOs = openWOsWithMags
    .filter((w) => !isWoComplete(producedPlacasFromMagazines(w.magazines, w.troquel), w.totalQty))
    .map((w) => ({
      id: w.id,
      woNumber: w.woNumber,
      productCode: w.productCode,
      magazineCapacity: w.magazineCapacity,
      troquel: w.troquel,
      totalQty: w.totalQty,
      smdLineId: w.smdLineId,
    }));

  const woIds = Array.from(new Set(rows.map((r) => r.workOrderId)));
  const woAllMags = woIds.length
    ? await prisma.magazine.findMany({
        where: { workOrderId: { in: woIds } },
        orderBy: { createdAt: "asc" },
        select: { id: true, workOrderId: true, placasCount: true, createdAt: true },
      })
    : [];
  const cumulative = cumulativeByMagazine(woAllMags);

  const exportQuery = new URLSearchParams();
  Object.entries(sp).forEach(([k, v]) => v && exportQuery.set(k, String(v)));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-bgh-700">Magazines</h1>
        <div className="flex gap-2">
          <a
            className="btn-secondary"
            href={`/api/magazines/export?format=xlsx&${exportQuery.toString()}`}
          >
            Exportar XLSX
          </a>
          <a
            className="btn-secondary"
            href={`/api/magazines/export?format=csv&${exportQuery.toString()}`}
          >
            CSV
          </a>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-bgh-400">
          Nuevo magazine
        </h2>
        <NewMagazineForm lines={lines} workOrders={eligibleWOs} />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-bgh-400">Filtros</h2>
        <MagazinesFilters lines={lines} workOrders={openWOs} initial={sp} />
      </section>

      <div className="card overflow-x-auto p-0">
        <table className="table-base">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>WO</th>
              <th>Producto</th>
              <th>Línea</th>
              <th>Cód. magazine</th>
              <th>Paneles</th>
              <th>Acumulado WO</th>
              <th>Turno</th>
              <th>Autor</th>
              {canManage && <th></th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={canManage ? 10 : 9} className="py-8 text-center text-bgh-400">
                  Sin registros.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.createdAt.toLocaleString("es-AR")}</td>
                <td className="font-medium">{r.workOrder.woNumber}</td>
                <td>{r.workOrder.productCode}</td>
                <td>{r.smdLine.name}</td>
                <td>{r.magazineCode}</td>
                <td className="text-right">{r.placasCount}</td>
                <td className="text-right font-medium text-bgh-700">
                  {(cumulative.get(r.id) ?? r.placasCount) * r.workOrder.troquel}
                </td>
                <td>{r.shift === "MORNING" ? "Mañana" : "Tarde"}</td>
                <td>{r.createdBy.fullName}</td>
                {canManage && (
                  <td>
                    <MagazineActions
                      mag={{
                        id: r.id,
                        magazineCode: r.magazineCode,
                        placasCount: r.placasCount,
                        shift: r.shift,
                        magazineCapacity: r.workOrder.magazineCapacity,
                      }}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
