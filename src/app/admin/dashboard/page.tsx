import { prisma } from "@/lib/db";
import { computeFpy } from "@/lib/fpy";
import {
  dailyStopTrend,
  mttrByStation,
  timeByLineToday,
  topFailures,
  topStationsByDuration,
} from "@/lib/lineStopAggregations";
import { DashboardCharts } from "./charts";

function startOfTodayLocal(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfTodayLocal(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function daysAgo(n: number): Date {
  const d = startOfTodayLocal();
  d.setDate(d.getDate() - n);
  return d;
}

export default async function DashboardPage() {
  const now = new Date();
  const today = startOfTodayLocal();
  const todayEnd = endOfTodayLocal();
  const since30 = daysAgo(30);

  const [allLines, openWOs, magazinesToday, defectivesToday, stopsLast30] =
    await Promise.all([
      prisma.smdLine.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
      prisma.workOrder.findMany({
        where: { status: "OPEN" },
        include: {
          smdLine: { select: { id: true, name: true } },
          magazines: { select: { placasCount: true } },
          defectiveReports: { select: { defectiveQty: true } },
        },
        orderBy: { openedAt: "desc" },
      }),
      prisma.magazine.findMany({
        where: { createdAt: { gte: today, lte: todayEnd } },
        select: {
          smdLineId: true,
          placasCount: true,
          workOrder: { select: { troquel: true } },
        },
      }),
      prisma.defectiveReport.findMany({
        where: { reportDate: { gte: today, lte: todayEnd } },
        select: { smdLineId: true, defectiveQty: true },
      }),
      prisma.lineStop.findMany({
        where: { startedAt: { gte: since30 } },
        select: {
          id: true,
          smdLineId: true,
          stationId: true,
          startedAt: true,
          endedAt: true,
          customFailure: true,
          commonFailure: { select: { label: true } },
          station: { select: { name: true } },
        },
      }),
    ]);

  // Chart 1: % avance acumulado por línea (sumando WOs abiertas de la línea)
  const completionByLine = allLines.map((l) => {
    const wos = openWOs.filter((w) => w.smdLineId === l.id);
    const produced = wos.reduce(
      (s, w) => s + w.magazines.reduce((a, m) => a + m.placasCount, 0) * w.troquel,
      0
    );
    const total = wos.reduce((s, w) => s + w.totalQty, 0);
    const pct = total > 0 ? Math.round((produced / total) * 1000) / 10 : 0;
    return { linea: l.name, pct, producido: produced, total };
  });

  // Chart 2: placas producidas hoy por línea
  const producedTodayByLine = allLines.map((l) => {
    const placas = magazinesToday
      .filter((m) => m.smdLineId === l.id)
      .reduce((s, m) => s + m.placasCount * m.workOrder.troquel, 0);
    const defectuosas = defectivesToday
      .filter((d) => d.smdLineId === l.id)
      .reduce((s, d) => s + d.defectiveQty, 0);
    return { linea: l.name, placas, defectuosas };
  });

  // Chart 3: FPY por línea por WO activa (un punto por WO, agrupado en chart por línea)
  const fpyByActiveWo = openWOs
    .map((w) => {
      const placas = w.magazines.reduce((a, m) => a + m.placasCount, 0) * w.troquel;
      const defectuosas = w.defectiveReports.reduce((a, d) => a + d.defectiveQty, 0);
      return {
        wo: w.woNumber,
        linea: w.smdLine.name,
        producto: w.productCode,
        placas,
        defectuosas,
        fpy: computeFpy(placas, defectuosas),
        label: `${w.smdLine.name} · ${w.woNumber}`,
      };
    })
    .sort((a, b) => a.linea.localeCompare(b.linea) || a.wo.localeCompare(b.wo));

  // Chart 4: % completado hoy según target diario por línea
  const dailyTargetByLine = allLines.map((l) => {
    const wos = openWOs.filter((w) => w.smdLineId === l.id);
    const target = wos.reduce((s, w) => s + (w.dailyTargetQty || 0), 0);
    const today = producedTodayByLine.find((x) => x.linea === l.name)?.placas ?? 0;
    const pct = target > 0 ? Math.round((today / target) * 1000) / 10 : 0;
    return { linea: l.name, hoy: today, target, pct };
  });

  // Charts de paradas
  const stopTimeTodayByLine = timeByLineToday(stopsLast30, allLines, now);
  const stopTrend7d = dailyStopTrend(stopsLast30, now, 7);
  const topStations7d = topStationsByDuration(stopsLast30, now, 7, 10);
  const topFailures7d = topFailures(stopsLast30, now, 7, 10);
  const mttr30d = mttrByStation(stopsLast30, now, 30, 15);

  // Tabla detalle WO abiertas
  const openWoDetail = openWOs.map((w) => {
    const produced = w.magazines.reduce((a, m) => a + m.placasCount, 0) * w.troquel;
    const defectuosas = w.defectiveReports.reduce((a, d) => a + d.defectiveQty, 0);
    const pct = w.totalQty > 0 ? Math.min(100, Math.round((produced / w.totalQty) * 100)) : 0;
    return {
      id: w.id,
      wo: w.woNumber,
      producto: w.productCode,
      linea: w.smdLine.name,
      target: w.totalQty,
      dailyTarget: w.dailyTargetQty,
      producido: produced,
      defectuosas,
      fpy: computeFpy(produced, defectuosas),
      pct,
    };
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-bgh-700">Dashboard</h1>

      <DashboardCharts
        completionByLine={completionByLine}
        producedTodayByLine={producedTodayByLine}
        fpyByActiveWo={fpyByActiveWo}
        dailyTargetByLine={dailyTargetByLine}
        stopTimeTodayByLine={stopTimeTodayByLine}
        stopTrend7d={stopTrend7d}
        topStations7d={topStations7d}
        topFailures7d={topFailures7d}
        mttr30d={mttr30d}
      />

      <div className="card">
        <h2 className="mb-3 text-lg font-semibold text-bgh-700">WOs abiertas — detalle</h2>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Línea</th>
                <th>WO</th>
                <th>Producto</th>
                <th>Producido</th>
                <th>Total</th>
                <th>Avance</th>
                <th>Target diario</th>
                <th>Defect.</th>
                <th>FPY</th>
              </tr>
            </thead>
            <tbody>
              {openWoDetail.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-bgh-400">
                    No hay WOs abiertas.
                  </td>
                </tr>
              )}
              {openWoDetail.map((w) => (
                <tr key={w.id}>
                  <td>{w.linea}</td>
                  <td className="font-medium">{w.wo}</td>
                  <td>{w.producto}</td>
                  <td className="text-right">{w.producido}</td>
                  <td className="text-right">{w.target}</td>
                  <td className="min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-full bg-bgh-50 rounded">
                        <div className="h-2 rounded bg-bgh-700" style={{ width: `${w.pct}%` }} />
                      </div>
                      <span className="text-xs w-10 text-right">{w.pct}%</span>
                    </div>
                  </td>
                  <td className="text-right">{w.dailyTarget || "—"}</td>
                  <td className="text-right">{w.defectuosas}</td>
                  <td className="text-right">{w.fpy === null ? "—" : `${w.fpy}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
