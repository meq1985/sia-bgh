export type StopForAggregation = {
  id: string;
  smdLineId: number;
  stationId: number;
  startedAt: Date;
  endedAt: Date | null;
  commonFailure: { label: string } | null;
  customFailure: string | null;
  station: { name: string };
};

export type LineRef = { id: number; name: string };

export type TimeByLinePoint = {
  linea: string;
  minutos: number;
  paradas: number;
};

export type TopStationPoint = {
  estacion: string;
  minutos: number;
  paradas: number;
};

export type TopFailurePoint = {
  falla: string;
  cantidad: number;
};

export type MttrPoint = {
  estacion: string;
  mttrMinutos: number;
  muestras: number;
};

export type DailyTrendPoint = {
  fecha: string;
  minutos: number;
  paradas: number;
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function durationMinutes(start: Date, end: Date | null, fallbackEnd: Date): number {
  const e = end ?? fallbackEnd;
  const diffMs = e.getTime() - start.getTime();
  if (diffMs <= 0) return 0;
  return Math.round(diffMs / 60_000);
}

function failureLabel(s: StopForAggregation): string {
  return s.commonFailure?.label ?? s.customFailure ?? "(sin falla)";
}

/**
 * Chart 3: tiempo total de parada por línea — hoy.
 * Incluye paradas en curso (calcula `now - startedAt`).
 */
export function timeByLineToday(
  stops: StopForAggregation[],
  lines: LineRef[],
  now: Date,
): TimeByLinePoint[] {
  const since = startOfDay(now);
  return lines.map((l) => {
    const lineStops = stops.filter(
      (s) => s.smdLineId === l.id && s.startedAt >= since,
    );
    const minutos = lineStops.reduce(
      (sum, s) => sum + durationMinutes(s.startedAt, s.endedAt, now),
      0,
    );
    return { linea: l.name, minutos, paradas: lineStops.length };
  });
}

/**
 * Chart 6: top N estaciones con más tiempo de parada en los últimos `days` días.
 * Solo cuenta paradas cerradas (con endedAt).
 */
export function topStationsByDuration(
  stops: StopForAggregation[],
  now: Date,
  days = 7,
  limit = 10,
): TopStationPoint[] {
  const since = startOfDay(new Date(now.getTime() - days * 24 * 60 * 60 * 1000));
  const closed = stops.filter((s) => s.endedAt !== null && s.startedAt >= since);
  const byStation = new Map<number, { estacion: string; minutos: number; paradas: number }>();
  for (const s of closed) {
    const acc = byStation.get(s.stationId) ?? {
      estacion: s.station.name,
      minutos: 0,
      paradas: 0,
    };
    acc.minutos += durationMinutes(s.startedAt, s.endedAt, now);
    acc.paradas += 1;
    byStation.set(s.stationId, acc);
  }
  return [...byStation.values()]
    .sort((a, b) => b.minutos - a.minutos)
    .slice(0, limit);
}

/**
 * Chart 7: top N fallas más frecuentes en los últimos `days` días.
 * Cuenta todas las paradas (cerradas o en curso). Agrupa por label de falla
 * (común o libre).
 */
export function topFailures(
  stops: StopForAggregation[],
  now: Date,
  days = 7,
  limit = 10,
): TopFailurePoint[] {
  const since = startOfDay(new Date(now.getTime() - days * 24 * 60 * 60 * 1000));
  const inRange = stops.filter((s) => s.startedAt >= since);
  const byLabel = new Map<string, number>();
  for (const s of inRange) {
    const label = failureLabel(s);
    byLabel.set(label, (byLabel.get(label) ?? 0) + 1);
  }
  return [...byLabel.entries()]
    .map(([falla, cantidad]) => ({ falla, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, limit);
}

/**
 * Chart 9: MTTR (Mean Time To Repair) por estación en los últimos `days` días.
 * Solo cuenta paradas cerradas. `mttrMinutos` es el promedio.
 */
export function mttrByStation(
  stops: StopForAggregation[],
  now: Date,
  days = 30,
  limit = 15,
): MttrPoint[] {
  const since = startOfDay(new Date(now.getTime() - days * 24 * 60 * 60 * 1000));
  const closed = stops.filter((s) => s.endedAt !== null && s.startedAt >= since);
  const byStation = new Map<number, { estacion: string; totalMin: number; muestras: number }>();
  for (const s of closed) {
    const acc = byStation.get(s.stationId) ?? {
      estacion: s.station.name,
      totalMin: 0,
      muestras: 0,
    };
    acc.totalMin += durationMinutes(s.startedAt, s.endedAt, now);
    acc.muestras += 1;
    byStation.set(s.stationId, acc);
  }
  return [...byStation.values()]
    .map((x) => ({
      estacion: x.estacion,
      mttrMinutos: x.muestras > 0 ? Math.round(x.totalMin / x.muestras) : 0,
      muestras: x.muestras,
    }))
    .sort((a, b) => b.mttrMinutos - a.mttrMinutos)
    .slice(0, limit);
}

/**
 * Chart 4: tendencia diaria de tiempo total de parada en los últimos `days` días.
 * Solo cuenta paradas cerradas (asegura comparabilidad entre días).
 * El día actual incluye lo cerrado hasta ahora — la jornada en curso queda parcial.
 */
export function dailyStopTrend(
  stops: StopForAggregation[],
  now: Date,
  days = 7,
): DailyTrendPoint[] {
  const points: DailyTrendPoint[] = [];
  const today = startOfDay(now);
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(day.getTime() + 24 * 60 * 60 * 1000);
    const dayStops = stops.filter(
      (s) =>
        s.endedAt !== null &&
        s.startedAt >= day &&
        s.startedAt < dayEnd,
    );
    const minutos = dayStops.reduce(
      (sum, s) => sum + durationMinutes(s.startedAt, s.endedAt, now),
      0,
    );
    points.push({
      fecha: `${String(day.getDate()).padStart(2, "0")}/${String(day.getMonth() + 1).padStart(2, "0")}`,
      minutos,
      paradas: dayStops.length,
    });
  }
  return points;
}
