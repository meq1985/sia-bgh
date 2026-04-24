import { prisma } from "@/lib/db";
import { DashboardCharts } from "./charts";

function startOfTodayLocal(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number): Date {
  const d = startOfTodayLocal();
  d.setDate(d.getDate() - n);
  return d;
}

export default async function DashboardPage() {
  const since30 = daysAgo(30);
  const since7 = daysAgo(7);
  const today = startOfTodayLocal();

  const [
    openWOs,
    allLines,
    magazinesLast30,
    magazinesLast7,
    defectivesLast30,
  ] = await Promise.all([
    prisma.workOrder.findMany({
      where: { status: "OPEN" },
      include: { magazines: { select: { placasCount: true } } },
      orderBy: { openedAt: "desc" },
    }),
    prisma.smdLine.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.magazine.findMany({
      where: { createdAt: { gte: since30 } },
      select: { smdLineId: true, placasCount: true, createdAt: true, shift: true, workOrderId: true },
    }),
    prisma.magazine.findMany({
      where: { createdAt: { gte: since7 } },
      select: { smdLineId: true, placasCount: true, createdAt: true, shift: true },
    }),
    prisma.defectiveReport.findMany({
      where: { reportDate: { gte: since30 } },
      select: { smdLineId: true, defectiveQty: true, reportDate: true },
    }),
  ]);

  const lineIdToName: Record<number, string> = Object.fromEntries(
    allLines.map((l) => [l.id, l.name])
  );

  const placasTodayByLine = allLines.map((l) => {
    const sum = magazinesLast7
      .filter((m) => m.smdLineId === l.id && m.createdAt >= today)
      .reduce((s, m) => s + m.placasCount, 0);
    return { linea: l.name, placas: sum };
  });

  const byLine30 = allLines.map((l) => {
    const rows = magazinesLast30.filter((m) => m.smdLineId === l.id);
    const total = rows.reduce((s, m) => s + m.placasCount, 0);
    const hours =
      rows.length === 0
        ? 0
        : Math.max(
            1,
            (Math.max(...rows.map((r) => r.createdAt.getTime())) -
              Math.min(...rows.map((r) => r.createdAt.getTime()))) /
              3_600_000
          );
    const defectives = defectivesLast30
      .filter((d) => d.smdLineId === l.id)
      .reduce((s, d) => s + d.defectiveQty, 0);
    return {
      linea: l.name,
      placas: total,
      placasPorHora: Math.round(total / hours),
      defectuosas: defectives,
    };
  });

  const dailyMap = new Map<string, { fecha: string; placas: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = daysAgo(i);
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, { fecha: key.slice(5), placas: 0 });
  }
  for (const m of magazinesLast7) {
    const key = m.createdAt.toISOString().slice(0, 10);
    const entry = dailyMap.get(key);
    if (entry) entry.placas += m.placasCount;
  }
  const daily = Array.from(dailyMap.values());

  const woProgress = openWOs.map((w) => {
    const produced = w.magazines.reduce((s, m) => s + m.placasCount, 0);
    const pct = w.totalQty > 0 ? Math.min(100, Math.round((produced / w.totalQty) * 100)) : 0;
    return { wo: w.woNumber, producto: w.productCode, producido: produced, total: w.totalQty, pct };
  });

  const totalPlacas30 = magazinesLast30.reduce((s, m) => s + m.placasCount, 0);
  const totalDefectuosas30 = defectivesLast30.reduce((s, d) => s + d.defectiveQty, 0);
  const fpy =
    totalPlacas30 + totalDefectuosas30 > 0
      ? ((totalPlacas30 / (totalPlacas30 + totalDefectuosas30)) * 100).toFixed(1)
      : "—";

  const morningVsAfternoon = [
    { turno: "Mañana", placas: magazinesLast30.filter((m) => m.shift === "MORNING").reduce((s, m) => s + m.placasCount, 0) },
    { turno: "Tarde", placas: magazinesLast30.filter((m) => m.shift === "AFTERNOON").reduce((s, m) => s + m.placasCount, 0) },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-bgh-700">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Placas últimos 30d" value={totalPlacas30.toLocaleString("es-AR")} />
        <Kpi label="Defectuosas últimos 30d" value={totalDefectuosas30.toLocaleString("es-AR")} />
        <Kpi label="FPY últimos 30d" value={`${fpy}${typeof fpy === "string" && fpy !== "—" ? "%" : ""}`} />
        <Kpi label="WO abiertas" value={openWOs.length.toString()} />
      </div>

      <DashboardCharts
        placasHoy={placasTodayByLine}
        byLine30={byLine30}
        daily={daily}
        turnoData={morningVsAfternoon}
      />

      <div className="card">
        <h2 className="mb-3 text-lg font-semibold text-bgh-700">Avance de WOs abiertas</h2>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>WO</th>
                <th>Producto</th>
                <th>Producido</th>
                <th>Total</th>
                <th>Avance</th>
              </tr>
            </thead>
            <tbody>
              {woProgress.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-bgh-400">No hay WOs abiertas.</td></tr>
              )}
              {woProgress.map((w) => (
                <tr key={w.wo}>
                  <td className="font-medium">{w.wo}</td>
                  <td>{w.producto}</td>
                  <td className="text-right">{w.producido}</td>
                  <td className="text-right">{w.total}</td>
                  <td className="min-w-[160px]">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-full bg-bgh-50 rounded">
                        <div className="h-2 rounded bg-bgh-700" style={{ width: `${w.pct}%` }} />
                      </div>
                      <span className="text-xs w-10 text-right">{w.pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div className="text-xs text-bgh-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-bgh-700">{value}</div>
    </div>
  );
}
