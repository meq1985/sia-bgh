import { prisma } from "@/lib/db";
import { FailuresClient } from "./client";

export default async function AdminFailuresPage() {
  const [stations, failures] = await Promise.all([
    prisma.station.findMany({ orderBy: { name: "asc" } }),
    prisma.commonFailure.findMany({
      orderBy: [{ stationId: "asc" }, { label: "asc" }],
      include: { station: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-bgh-700">Fallas comunes</h1>
      <p className="text-sm text-bgh-400">
        Catálogo de fallas comunes por estación. El operador las elige del desplegable al
        cargar una parada. Si una falla está en uso no se puede borrar — desactivala.
      </p>
      <FailuresClient stations={stations} failures={failures} />
    </div>
  );
}
