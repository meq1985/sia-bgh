import Link from "next/link";
import { prisma } from "@/lib/db";
import { MagazinesFilters } from "./filters";

type SearchParams = Promise<{
  workOrderId?: string;
  smdLineId?: string;
  shift?: string;
  from?: string;
  to?: string;
}>;

export default async function MagazinesPage({ searchParams }: { searchParams: SearchParams }) {
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

  const [rows, lines, openWOs] = await Promise.all([
    prisma.magazine.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        workOrder: { select: { woNumber: true, productCode: true, magazineCapacity: true } },
        smdLine: { select: { name: true } },
        createdBy: { select: { username: true, fullName: true } },
      },
    }),
    prisma.smdLine.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.workOrder.findMany({ orderBy: { openedAt: "desc" }, take: 200 }),
  ]);

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
          <Link className="btn-primary" href="/magazines/new">Nuevo magazine</Link>
        </div>
      </div>

      <MagazinesFilters lines={lines} workOrders={openWOs} initial={sp} />

      <div className="card overflow-x-auto p-0">
        <table className="table-base">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>WO</th>
              <th>Producto</th>
              <th>Línea</th>
              <th>Cód. magazine</th>
              <th>Placas</th>
              <th>Cap.</th>
              <th>Turno</th>
              <th>Autor</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-bgh-400">Sin registros.</td>
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
                <td className="text-right text-bgh-400">{r.workOrder.magazineCapacity}</td>
                <td>{r.shift === "MORNING" ? "Mañana" : "Tarde"}</td>
                <td>{r.createdBy.fullName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
