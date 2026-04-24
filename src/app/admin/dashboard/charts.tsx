"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
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

type LineStat = { linea: string; placas: number; placasPorHora: number; defectuosas: number };
type DailyPoint = { fecha: string; placas: number };
type TodayPoint = { linea: string; placas: number };
type TurnoPoint = { turno: string; placas: number };

export function DashboardCharts({
  placasHoy,
  byLine30,
  daily,
  turnoData,
}: {
  placasHoy: TodayPoint[];
  byLine30: LineStat[];
  daily: DailyPoint[];
  turnoData: TurnoPoint[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="card">
        <h3 className="mb-3 font-semibold text-bgh-700">Placas de hoy por línea</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={placasHoy}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2fb" />
            <XAxis dataKey="linea" stroke={AZUL} />
            <YAxis stroke={AZUL} />
            <Tooltip />
            <Bar dataKey="placas" fill={AZUL} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 className="mb-3 font-semibold text-bgh-700">Últimos 7 días</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2fb" />
            <XAxis dataKey="fecha" stroke={AZUL} />
            <YAxis stroke={AZUL} />
            <Tooltip />
            <Line type="monotone" dataKey="placas" stroke={AZUL} strokeWidth={2} dot={{ fill: AZUL }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card lg:col-span-2">
        <h3 className="mb-3 font-semibold text-bgh-700">Comparativa por línea (30 días)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={byLine30}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2fb" />
            <XAxis dataKey="linea" stroke={AZUL} />
            <YAxis stroke={AZUL} />
            <Tooltip />
            <Legend />
            <Bar dataKey="placas" name="Placas totales" fill={AZUL} />
            <Bar dataKey="placasPorHora" name="Placas/hora" fill={AZUL_CLARO} />
            <Bar dataKey="defectuosas" name="Defectuosas" fill="#c0392b" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 className="mb-3 font-semibold text-bgh-700">Distribución por turno (30 días)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={turnoData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2fb" />
            <XAxis dataKey="turno" stroke={AZUL} />
            <YAxis stroke={AZUL} />
            <Tooltip />
            <Bar dataKey="placas" fill={AZUL_MUY_CLARO} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
