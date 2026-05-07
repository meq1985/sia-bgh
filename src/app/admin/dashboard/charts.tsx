"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const AZUL = "#14387f";
const AZUL_CLARO = "#506fc9";
const AZUL_MUY_CLARO = "#adbdea";
const ROJO = "#c0392b";
const VERDE = "#0f9d58";
const NARANJA = "#e67e22";

type CompletionPoint = { linea: string; pct: number; producido: number; total: number };
type ProducedTodayPoint = { linea: string; placas: number; defectuosas: number };
type FpyPoint = {
  wo: string;
  linea: string;
  producto: string;
  placas: number;
  defectuosas: number;
  fpy: number | null;
  label: string;
};
type DailyTargetPoint = { linea: string; hoy: number; target: number; pct: number };

type StopTimeTodayPoint = { linea: string; minutos: number; paradas: number };
type StopTrendPoint = { fecha: string; minutos: number; paradas: number };
type TopStationPoint = { estacion: string; minutos: number; paradas: number };
type TopFailurePoint = { falla: string; cantidad: number };
type MttrPoint = { estacion: string; mttrMinutos: number; muestras: number };

function colorByPct(pct: number): string {
  if (pct >= 90) return VERDE;
  if (pct >= 60) return AZUL;
  if (pct >= 30) return NARANJA;
  return ROJO;
}

function fmtMinutes(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function DashboardCharts({
  completionByLine,
  producedTodayByLine,
  fpyByActiveWo,
  dailyTargetByLine,
  stopTimeTodayByLine,
  stopTrend7d,
  topStations7d,
  topFailures7d,
  mttr30d,
}: {
  completionByLine: CompletionPoint[];
  producedTodayByLine: ProducedTodayPoint[];
  fpyByActiveWo: FpyPoint[];
  dailyTargetByLine: DailyTargetPoint[];
  stopTimeTodayByLine: StopTimeTodayPoint[];
  stopTrend7d: StopTrendPoint[];
  topStations7d: TopStationPoint[];
  topFailures7d: TopFailurePoint[];
  mttr30d: MttrPoint[];
}) {
  return (
    <>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-bgh-400">Producción</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="mb-1 font-semibold text-bgh-700">Avance de orden por línea</h3>
          <p className="mb-2 text-xs text-bgh-400">
            % producido vs total objetivo, sumando todas las WOs abiertas de cada línea.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={completionByLine}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2fb" />
              <XAxis dataKey="linea" stroke={AZUL} />
              <YAxis stroke={AZUL} domain={[0, 100]} unit="%" />
              <Tooltip
                formatter={(_v, _k, item) => {
                  const p = item.payload as CompletionPoint;
                  return [`${p.pct}% (${p.producido}/${p.total})`, "Avance"];
                }}
              />
              <Bar dataKey="pct">
                {completionByLine.map((p, i) => (
                  <Cell key={i} fill={colorByPct(p.pct)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-1 font-semibold text-bgh-700">Producción de hoy por línea</h3>
          <p className="mb-2 text-xs text-bgh-400">
            Placas registradas y defectuosas reportadas en el día actual.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={producedTodayByLine}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2fb" />
              <XAxis dataKey="linea" stroke={AZUL} />
              <YAxis stroke={AZUL} />
              <Tooltip />
              <Legend />
              <Bar dataKey="placas" name="Placas" fill={AZUL} />
              <Bar dataKey="defectuosas" name="Defectuosas" fill={ROJO} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="mb-1 font-semibold text-bgh-700">FPY por WO activa (agrupado por línea)</h3>
          <p className="mb-2 text-xs text-bgh-400">
            First-Pass Yield = placas / (placas + defectuosas) acumulado de la WO.
            Las WOs sin producción aún se muestran sin valor.
          </p>
          {fpyByActiveWo.length === 0 ? (
            <div className="py-6 text-center text-sm text-bgh-400">No hay WOs abiertas.</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(260, fpyByActiveWo.length * 32)}>
              <BarChart data={fpyByActiveWo} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2fb" />
                <XAxis type="number" domain={[0, 100]} unit="%" stroke={AZUL} />
                <YAxis type="category" dataKey="label" stroke={AZUL} width={140} />
                <Tooltip
                  formatter={(_v, _k, item) => {
                    const p = item.payload as FpyPoint;
                    return [
                      p.fpy === null
                        ? "Sin datos"
                        : `${p.fpy}% (placas ${p.placas} · defect. ${p.defectuosas})`,
                      "FPY",
                    ];
                  }}
                />
                <Bar dataKey="fpy">
                  {fpyByActiveWo.map((p, i) => (
                    <Cell key={i} fill={p.fpy === null ? AZUL_MUY_CLARO : colorByPct(p.fpy)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card lg:col-span-2">
          <h3 className="mb-1 font-semibold text-bgh-700">Cumplimiento del objetivo diario por línea</h3>
          <p className="mb-2 text-xs text-bgh-400">
            % producido hoy vs suma de la cantidad diaria estimada de las WOs abiertas de la línea.
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyTargetByLine}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2fb" />
              <XAxis dataKey="linea" stroke={AZUL} />
              <YAxis yAxisId="left" stroke={AZUL} />
              <YAxis yAxisId="right" orientation="right" stroke={AZUL_CLARO} domain={[0, 120]} unit="%" />
              <Tooltip
                formatter={(value, key, item) => {
                  const p = item.payload as DailyTargetPoint;
                  if (key === "pct") return [`${p.pct}%`, "Cumplimiento"];
                  if (key === "hoy") return [`${value}`, "Producido hoy"];
                  if (key === "target") return [`${value}`, "Target diario"];
                  return [String(value), String(key)];
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="target" name="Target diario" fill={AZUL_MUY_CLARO} />
              <Bar yAxisId="left" dataKey="hoy" name="Producido hoy" fill={AZUL} />
              <Bar yAxisId="right" dataKey="pct" name="Cumplimiento %">
                {dailyTargetByLine.map((p, i) => (
                  <Cell key={i} fill={colorByPct(p.pct)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <h2 className="text-sm font-semibold uppercase tracking-wide text-bgh-400">Paradas de línea</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="mb-1 font-semibold text-bgh-700">Tiempo de parada hoy por línea</h3>
          <p className="mb-2 text-xs text-bgh-400">
            Suma de minutos de paradas iniciadas hoy. Las paradas en curso se cuentan
            con el tiempo transcurrido hasta ahora.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stopTimeTodayByLine}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2fb" />
              <XAxis dataKey="linea" stroke={AZUL} />
              <YAxis stroke={AZUL} unit="m" />
              <Tooltip
                formatter={(_v, _k, item) => {
                  const p = item.payload as StopTimeTodayPoint;
                  return [`${fmtMinutes(p.minutos)} (${p.paradas} paradas)`, "Tiempo"];
                }}
              />
              <Bar dataKey="minutos" fill={ROJO} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-1 font-semibold text-bgh-700">Tendencia diaria — últimos 7 días</h3>
          <p className="mb-2 text-xs text-bgh-400">
            Minutos totales de paradas cerradas por día. La jornada en curso queda parcial.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stopTrend7d}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2fb" />
              <XAxis dataKey="fecha" stroke={AZUL} />
              <YAxis stroke={AZUL} unit="m" />
              <Tooltip
                formatter={(_v, _k, item) => {
                  const p = item.payload as StopTrendPoint;
                  return [`${fmtMinutes(p.minutos)} (${p.paradas} paradas)`, "Tiempo"];
                }}
              />
              <Line
                type="monotone"
                dataKey="minutos"
                stroke={AZUL}
                strokeWidth={2}
                dot={{ fill: AZUL }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-1 font-semibold text-bgh-700">
            Top estaciones por tiempo de parada — últimos 7 días
          </h3>
          <p className="mb-2 text-xs text-bgh-400">
            Top 10 estaciones con más minutos acumulados (solo paradas cerradas).
          </p>
          {topStations7d.length === 0 ? (
            <div className="py-6 text-center text-sm text-bgh-400">Sin paradas en el período.</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(260, topStations7d.length * 32)}>
              <BarChart data={topStations7d} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2fb" />
                <XAxis type="number" stroke={AZUL} unit="m" />
                <YAxis type="category" dataKey="estacion" stroke={AZUL} width={120} />
                <Tooltip
                  formatter={(_v, _k, item) => {
                    const p = item.payload as TopStationPoint;
                    return [`${fmtMinutes(p.minutos)} (${p.paradas} paradas)`, "Tiempo"];
                  }}
                />
                <Bar dataKey="minutos" fill={ROJO} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 className="mb-1 font-semibold text-bgh-700">
            Top fallas más frecuentes — últimos 7 días
          </h3>
          <p className="mb-2 text-xs text-bgh-400">
            Top 10 fallas (catálogo + texto libre) por cantidad de paradas.
          </p>
          {topFailures7d.length === 0 ? (
            <div className="py-6 text-center text-sm text-bgh-400">Sin paradas en el período.</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(260, topFailures7d.length * 32)}>
              <BarChart data={topFailures7d} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2fb" />
                <XAxis type="number" stroke={AZUL} allowDecimals={false} />
                <YAxis type="category" dataKey="falla" stroke={AZUL} width={180} />
                <Tooltip />
                <Bar dataKey="cantidad" name="Paradas" fill={NARANJA} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card lg:col-span-2">
          <h3 className="mb-1 font-semibold text-bgh-700">
            MTTR por estación — últimos 30 días
          </h3>
          <p className="mb-2 text-xs text-bgh-400">
            Tiempo promedio de resolución (Mean Time To Repair) por estación, en minutos.
            Solo cuenta paradas cerradas.
          </p>
          {mttr30d.length === 0 ? (
            <div className="py-6 text-center text-sm text-bgh-400">Sin paradas en el período.</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(260, mttr30d.length * 32)}>
              <BarChart data={mttr30d} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2fb" />
                <XAxis type="number" stroke={AZUL} unit="m" />
                <YAxis type="category" dataKey="estacion" stroke={AZUL} width={120} />
                <Tooltip
                  formatter={(_v, _k, item) => {
                    const p = item.payload as MttrPoint;
                    return [`${fmtMinutes(p.mttrMinutos)} (${p.muestras} muestras)`, "MTTR"];
                  }}
                />
                <Bar dataKey="mttrMinutos" fill={AZUL_CLARO} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </>
  );
}
