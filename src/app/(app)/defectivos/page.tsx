import { prisma } from "@/lib/db";
import { NewDefectiveForm } from "./form";

export default async function DefectivosPage() {
  const [rows, lines, wos] = await Promise.all([
    prisma.defectiveReport.findMany({
      orderBy: [{ reportDate: "desc" }, { createdAt: "desc" }],
      take: 200,
      include: {
        smdLine: { select: { name: true } },
        workOrder: { select: { woNumber: true, productCode: true } },
        reportedBy: { select: { fullName: true } },
      },
    }),
    prisma.smdLine.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.workOrder.findMany({ orderBy: { openedAt: "desc" }, take: 200 }),
  ]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-bgh-700">Placas defectuosas (fin de turno)</h1>
      <NewDefectiveForm lines={lines} workOrders={wos} />
      <div className="card overflow-x-auto p-0">
        <table className="table-base">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Turno</th>
              <th>Línea</th>
              <th>WO</th>
              <th>Producto</th>
              <th>Defectuosas</th>
              <th>Reportó</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={7} className="py-8 text-center text-bgh-400">Sin reportes.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.reportDate.toLocaleDateString("es-AR")}</td>
                <td>{r.shift === "MORNING" ? "Mañana" : "Tarde"}</td>
                <td>{r.smdLine.name}</td>
                <td className="font-medium">{r.workOrder.woNumber}</td>
                <td>{r.workOrder.productCode}</td>
                <td className="text-right">{r.defectiveQty}</td>
                <td>{r.reportedBy.fullName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
