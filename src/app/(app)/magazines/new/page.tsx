import { prisma } from "@/lib/db";
import { NewMagazineForm } from "./form";

export default async function NewMagazinePage() {
  const [lines, openWOs] = await Promise.all([
    prisma.smdLine.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.workOrder.findMany({
      where: { status: "OPEN" },
      orderBy: { openedAt: "desc" },
      select: {
        id: true,
        woNumber: true,
        productCode: true,
        magazineCapacity: true,
        totalQty: true,
        smdLineId: true,
      },
    }),
  ]);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-bgh-700">Nuevo magazine</h1>
      <p className="text-sm text-bgh-400">
        Elegí primero la línea; solo vas a ver las WO abiertas de esa línea.
        El turno se precarga según la hora pero podés editarlo.
      </p>
      <NewMagazineForm lines={lines} workOrders={openWOs} />
    </div>
  );
}
