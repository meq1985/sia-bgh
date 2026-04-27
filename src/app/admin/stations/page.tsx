import { prisma } from "@/lib/db";
import { StationsTable } from "./table";
import { NewStationForm } from "./new-station-form";

export default async function AdminStationsPage() {
  const rows = await prisma.station.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { failures: true, lineStops: true } } },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-bgh-700">Estaciones</h1>
      <p className="text-sm text-bgh-400">
        Estaciones donde puede ocurrir una parada. Si una estación tiene paradas registradas
        no se puede borrar — desactivala para que deje de aparecer en los formularios.
      </p>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-bgh-400">Nueva estación</h2>
        <NewStationForm />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-bgh-400">Listado</h2>
        <StationsTable rows={rows} />
      </section>
    </div>
  );
}
