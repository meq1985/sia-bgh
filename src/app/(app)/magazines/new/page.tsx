import { prisma } from "@/lib/db";
import { isWoComplete, producedFromMagazines } from "@/lib/wo";
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
        magazines: { select: { placasCount: true } },
      },
    }),
  ]);

  const eligibleWOs = openWOs
    .filter((w) => !isWoComplete(producedFromMagazines(w.magazines), w.totalQty))
    .map((w) => ({
      id: w.id,
      woNumber: w.woNumber,
      productCode: w.productCode,
      magazineCapacity: w.magazineCapacity,
      totalQty: w.totalQty,
      smdLineId: w.smdLineId,
    }));

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-bgh-700">Nuevo magazine</h1>
      <p className="text-sm text-bgh-400">
        Elegí primero la línea; solo vas a ver las WO abiertas de esa línea.
        El turno se precarga según la hora pero podés editarlo.
      </p>
      <NewMagazineForm lines={lines} workOrders={eligibleWOs} />
    </div>
  );
}
