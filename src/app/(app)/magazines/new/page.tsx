import { prisma } from "@/lib/db";
import { NewMagazineForm } from "./form";

export default async function NewMagazinePage() {
  const [lines, openWOs] = await Promise.all([
    prisma.smdLine.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.workOrder.findMany({
      where: { status: "OPEN" },
      orderBy: { openedAt: "desc" },
    }),
  ]);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-bgh-700">Nuevo magazine</h1>
      <p className="text-sm text-bgh-400">
        Registrá un magazine cerrado al salir de la línea. El turno se precarga según la hora pero podés editarlo.
      </p>
      <NewMagazineForm lines={lines} workOrders={openWOs} />
    </div>
  );
}
