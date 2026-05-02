import { describe, expect, it } from "vitest";
import {
  dailyStopTrend,
  mttrByStation,
  timeByLineToday,
  topFailures,
  topStationsByDuration,
  type StopForAggregation,
} from "./lineStopAggregations";

const NOW = new Date("2026-04-30T15:00:00.000Z");

function stop(overrides: Partial<StopForAggregation> & { startedAt: Date }): StopForAggregation {
  return {
    id: overrides.id ?? Math.random().toString(36).slice(2),
    smdLineId: overrides.smdLineId ?? 1,
    stationId: overrides.stationId ?? 10,
    startedAt: overrides.startedAt,
    endedAt: overrides.endedAt ?? null,
    commonFailure: overrides.commonFailure ?? null,
    customFailure: overrides.customFailure ?? null,
    station: overrides.station ?? { name: "loader" },
  };
}

describe("timeByLineToday", () => {
  const lines = [
    { id: 1, name: "SMD1" },
    { id: 2, name: "SMD2" },
  ];

  it("devuelve 0 minutos para líneas sin paradas hoy", () => {
    const result = timeByLineToday([], lines, NOW);
    expect(result).toEqual([
      { linea: "SMD1", minutos: 0, paradas: 0 },
      { linea: "SMD2", minutos: 0, paradas: 0 },
    ]);
  });

  it("suma duraciones de paradas cerradas dentro del día", () => {
    const stops = [
      stop({
        smdLineId: 1,
        startedAt: new Date("2026-04-30T08:00:00.000Z"),
        endedAt: new Date("2026-04-30T08:30:00.000Z"),
      }),
      stop({
        smdLineId: 1,
        startedAt: new Date("2026-04-30T10:00:00.000Z"),
        endedAt: new Date("2026-04-30T10:15:00.000Z"),
      }),
    ];
    const result = timeByLineToday(stops, lines, NOW);
    expect(result[0]).toEqual({ linea: "SMD1", minutos: 45, paradas: 2 });
  });

  it("incluye paradas en curso usando now como fin", () => {
    const stops = [
      stop({
        smdLineId: 2,
        startedAt: new Date("2026-04-30T14:30:00.000Z"),
        endedAt: null,
      }),
    ];
    const result = timeByLineToday(stops, lines, NOW);
    expect(result[1]).toEqual({ linea: "SMD2", minutos: 30, paradas: 1 });
  });

  it("excluye paradas de días anteriores", () => {
    const stops = [
      stop({
        smdLineId: 1,
        startedAt: new Date("2026-04-29T10:00:00.000Z"),
        endedAt: new Date("2026-04-29T11:00:00.000Z"),
      }),
    ];
    const result = timeByLineToday(stops, lines, NOW);
    expect(result[0].minutos).toBe(0);
    expect(result[0].paradas).toBe(0);
  });

  it("no mezcla líneas distintas", () => {
    const stops = [
      stop({
        smdLineId: 1,
        startedAt: new Date("2026-04-30T08:00:00.000Z"),
        endedAt: new Date("2026-04-30T09:00:00.000Z"),
      }),
      stop({
        smdLineId: 2,
        startedAt: new Date("2026-04-30T08:00:00.000Z"),
        endedAt: new Date("2026-04-30T08:10:00.000Z"),
      }),
    ];
    const result = timeByLineToday(stops, lines, NOW);
    expect(result[0].minutos).toBe(60);
    expect(result[1].minutos).toBe(10);
  });
});

describe("topStationsByDuration", () => {
  it("devuelve array vacío si no hay paradas en el rango", () => {
    expect(topStationsByDuration([], NOW)).toEqual([]);
  });

  it("ignora paradas en curso", () => {
    const stops = [
      stop({
        stationId: 10,
        startedAt: new Date("2026-04-29T10:00:00.000Z"),
        endedAt: null,
      }),
    ];
    expect(topStationsByDuration(stops, NOW)).toEqual([]);
  });

  it("agrupa por estación y suma duración", () => {
    const stops = [
      stop({
        stationId: 10,
        station: { name: "loader" },
        startedAt: new Date("2026-04-29T10:00:00.000Z"),
        endedAt: new Date("2026-04-29T10:30:00.000Z"),
      }),
      stop({
        stationId: 10,
        station: { name: "loader" },
        startedAt: new Date("2026-04-28T08:00:00.000Z"),
        endedAt: new Date("2026-04-28T08:15:00.000Z"),
      }),
      stop({
        stationId: 20,
        station: { name: "printer" },
        startedAt: new Date("2026-04-29T11:00:00.000Z"),
        endedAt: new Date("2026-04-29T13:00:00.000Z"),
      }),
    ];
    const result = topStationsByDuration(stops, NOW);
    expect(result).toEqual([
      { estacion: "printer", minutos: 120, paradas: 1 },
      { estacion: "loader", minutos: 45, paradas: 2 },
    ]);
  });

  it("respeta el límite de top N", () => {
    const stops = Array.from({ length: 12 }, (_, i) =>
      stop({
        stationId: i,
        station: { name: `s${i}` },
        startedAt: new Date("2026-04-29T10:00:00.000Z"),
        endedAt: new Date(`2026-04-29T10:${String(i + 1).padStart(2, "0")}:00.000Z`),
      }),
    );
    expect(topStationsByDuration(stops, NOW, 7, 5)).toHaveLength(5);
  });

  it("excluye paradas fuera del rango de días", () => {
    const stops = [
      stop({
        stationId: 10,
        startedAt: new Date("2026-04-01T10:00:00.000Z"),
        endedAt: new Date("2026-04-01T11:00:00.000Z"),
      }),
    ];
    expect(topStationsByDuration(stops, NOW, 7)).toEqual([]);
  });
});

describe("topFailures", () => {
  it("devuelve array vacío sin paradas", () => {
    expect(topFailures([], NOW)).toEqual([]);
  });

  it("cuenta cada falla común por su label", () => {
    const stops = [
      stop({
        startedAt: new Date("2026-04-29T10:00:00.000Z"),
        commonFailure: { label: "Stencil sucio" },
      }),
      stop({
        startedAt: new Date("2026-04-29T11:00:00.000Z"),
        commonFailure: { label: "Stencil sucio" },
      }),
      stop({
        startedAt: new Date("2026-04-29T12:00:00.000Z"),
        commonFailure: { label: "Falta pasta" },
      }),
    ];
    const result = topFailures(stops, NOW);
    expect(result).toEqual([
      { falla: "Stencil sucio", cantidad: 2 },
      { falla: "Falta pasta", cantidad: 1 },
    ]);
  });

  it("usa customFailure si no hay común", () => {
    const stops = [
      stop({
        startedAt: new Date("2026-04-29T10:00:00.000Z"),
        commonFailure: null,
        customFailure: "Falla rara",
      }),
    ];
    expect(topFailures(stops, NOW)[0]).toEqual({ falla: "Falla rara", cantidad: 1 });
  });

  it("etiqueta como '(sin falla)' cuando no hay ninguna", () => {
    const stops = [
      stop({
        startedAt: new Date("2026-04-29T10:00:00.000Z"),
        commonFailure: null,
        customFailure: null,
      }),
    ];
    expect(topFailures(stops, NOW)[0]).toEqual({ falla: "(sin falla)", cantidad: 1 });
  });

  it("incluye paradas en curso (no descrimina por status)", () => {
    const stops = [
      stop({
        startedAt: new Date("2026-04-29T10:00:00.000Z"),
        endedAt: null,
        commonFailure: { label: "Activa" },
      }),
    ];
    expect(topFailures(stops, NOW)).toEqual([{ falla: "Activa", cantidad: 1 }]);
  });
});

describe("mttrByStation", () => {
  it("devuelve array vacío sin paradas cerradas", () => {
    expect(mttrByStation([], NOW)).toEqual([]);
  });

  it("calcula promedio en minutos por estación", () => {
    const stops = [
      stop({
        stationId: 10,
        station: { name: "loader" },
        startedAt: new Date("2026-04-29T10:00:00.000Z"),
        endedAt: new Date("2026-04-29T10:10:00.000Z"),
      }),
      stop({
        stationId: 10,
        station: { name: "loader" },
        startedAt: new Date("2026-04-29T11:00:00.000Z"),
        endedAt: new Date("2026-04-29T11:30:00.000Z"),
      }),
    ];
    const result = mttrByStation(stops, NOW);
    expect(result).toEqual([{ estacion: "loader", mttrMinutos: 20, muestras: 2 }]);
  });

  it("ignora paradas en curso", () => {
    const stops = [
      stop({
        stationId: 10,
        startedAt: new Date("2026-04-29T10:00:00.000Z"),
        endedAt: null,
      }),
    ];
    expect(mttrByStation(stops, NOW)).toEqual([]);
  });

  it("ordena por MTTR descendente", () => {
    const stops = [
      stop({
        stationId: 10,
        station: { name: "loader" },
        startedAt: new Date("2026-04-29T10:00:00.000Z"),
        endedAt: new Date("2026-04-29T10:05:00.000Z"),
      }),
      stop({
        stationId: 20,
        station: { name: "horno" },
        startedAt: new Date("2026-04-29T11:00:00.000Z"),
        endedAt: new Date("2026-04-29T13:00:00.000Z"),
      }),
    ];
    const result = mttrByStation(stops, NOW);
    expect(result.map((r) => r.estacion)).toEqual(["horno", "loader"]);
  });
});

describe("dailyStopTrend", () => {
  it("devuelve N puntos para N días", () => {
    expect(dailyStopTrend([], NOW, 7)).toHaveLength(7);
    expect(dailyStopTrend([], NOW, 14)).toHaveLength(14);
  });

  it("0 minutos cuando no hay paradas", () => {
    const result = dailyStopTrend([], NOW, 7);
    expect(result.every((p) => p.minutos === 0 && p.paradas === 0)).toBe(true);
  });

  it("agrupa paradas por día de inicio", () => {
    const stops = [
      stop({
        startedAt: new Date("2026-04-29T10:00:00.000Z"),
        endedAt: new Date("2026-04-29T10:30:00.000Z"),
      }),
      stop({
        startedAt: new Date("2026-04-29T14:00:00.000Z"),
        endedAt: new Date("2026-04-29T14:15:00.000Z"),
      }),
      stop({
        startedAt: new Date("2026-04-30T08:00:00.000Z"),
        endedAt: new Date("2026-04-30T09:00:00.000Z"),
      }),
    ];
    const result = dailyStopTrend(stops, NOW, 7);
    const day29 = result.find((p) => p.fecha === "29/04");
    const day30 = result.find((p) => p.fecha === "30/04");
    expect(day29).toEqual({ fecha: "29/04", minutos: 45, paradas: 2 });
    expect(day30).toEqual({ fecha: "30/04", minutos: 60, paradas: 1 });
  });

  it("ignora paradas en curso", () => {
    const stops = [
      stop({
        startedAt: new Date("2026-04-29T10:00:00.000Z"),
        endedAt: null,
      }),
    ];
    const result = dailyStopTrend(stops, NOW, 7);
    expect(result.every((p) => p.minutos === 0 && p.paradas === 0)).toBe(true);
  });

  it("último punto es el día actual (now)", () => {
    const result = dailyStopTrend([], NOW, 7);
    expect(result[result.length - 1].fecha).toBe("30/04");
  });
});
