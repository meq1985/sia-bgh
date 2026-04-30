import { describe, expect, it } from "vitest";
import {
  STOP_CODES,
  VALID_STOP_CODES,
  categoryForCode,
  categoryLabel,
  computeStopDurationSec,
  formatDurationSec,
  stopCodeInfo,
} from "./stopCodes";

describe("STOP_CODES catálogo", () => {
  it("tiene exactamente 18 entradas", () => {
    expect(STOP_CODES).toHaveLength(18);
  });

  it("códigos son consecutivos del 1 al 18 sin huecos", () => {
    expect(STOP_CODES.map((s) => s.code)).toEqual(
      Array.from({ length: 18 }, (_, i) => i + 1),
    );
  });

  it("VALID_STOP_CODES expone los 18 códigos", () => {
    expect(VALID_STOP_CODES.size).toBe(18);
    expect(VALID_STOP_CODES.has(1)).toBe(true);
    expect(VALID_STOP_CODES.has(18)).toBe(true);
    expect(VALID_STOP_CODES.has(0)).toBe(false);
    expect(VALID_STOP_CODES.has(19)).toBe(false);
  });

  it("respeta la categorización del formulario BSIA F.20", () => {
    const operator = STOP_CODES.filter((s) => s.category === "OPERATOR");
    const maintenance = STOP_CODES.filter((s) => s.category === "MAINTENANCE");
    const programmer = STOP_CODES.filter((s) => s.category === "PROGRAMMER");
    expect(operator).toHaveLength(12);
    expect(maintenance).toHaveLength(4);
    expect(programmer).toHaveLength(2);
  });
});

describe("stopCodeInfo", () => {
  it("devuelve la entrada para un código válido", () => {
    expect(stopCodeInfo(1)?.label).toBe("Control de carga");
    expect(stopCodeInfo(14)?.label).toBe("Mantenimiento preventivo");
    expect(stopCodeInfo(18)?.label).toBe("Lanzamientos / Programador");
  });

  it("devuelve undefined para códigos fuera de rango", () => {
    expect(stopCodeInfo(0)).toBeUndefined();
    expect(stopCodeInfo(19)).toBeUndefined();
    expect(stopCodeInfo(-1)).toBeUndefined();
    expect(stopCodeInfo(100)).toBeUndefined();
  });
});

describe("categoryForCode", () => {
  it("códigos 1..12 son OPERATOR", () => {
    for (let c = 1; c <= 12; c++) {
      expect(categoryForCode(c)).toBe("OPERATOR");
    }
  });

  it("códigos 13..16 son MAINTENANCE", () => {
    for (let c = 13; c <= 16; c++) {
      expect(categoryForCode(c)).toBe("MAINTENANCE");
    }
  });

  it("códigos 17..18 son PROGRAMMER", () => {
    expect(categoryForCode(17)).toBe("PROGRAMMER");
    expect(categoryForCode(18)).toBe("PROGRAMMER");
  });

  it("devuelve null para códigos inválidos", () => {
    expect(categoryForCode(0)).toBeNull();
    expect(categoryForCode(19)).toBeNull();
    expect(categoryForCode(-1)).toBeNull();
  });
});

describe("categoryLabel", () => {
  it("traduce las 3 categorías al español", () => {
    expect(categoryLabel("OPERATOR")).toBe("Operador");
    expect(categoryLabel("MAINTENANCE")).toBe("Mantenimiento");
    expect(categoryLabel("PROGRAMMER")).toBe("Programador");
  });
});

describe("computeStopDurationSec", () => {
  const start = new Date("2026-04-30T10:00:00.000Z");

  it("devuelve null cuando endedAt es null (parada en curso)", () => {
    expect(computeStopDurationSec(start, null)).toBeNull();
  });

  it("clampa a 0 si endedAt es anterior a startedAt", () => {
    const earlier = new Date("2026-04-30T09:00:00.000Z");
    expect(computeStopDurationSec(start, earlier)).toBe(0);
  });

  it("calcula la duración en segundos", () => {
    const end = new Date("2026-04-30T10:00:30.000Z");
    expect(computeStopDurationSec(start, end)).toBe(30);
  });

  it("redondea milisegundos al segundo más cercano", () => {
    expect(
      computeStopDurationSec(start, new Date("2026-04-30T10:00:00.500Z")),
    ).toBe(1);
    expect(
      computeStopDurationSec(start, new Date("2026-04-30T10:00:00.499Z")),
    ).toBe(0);
  });

  it("calcula duraciones largas correctamente", () => {
    const end = new Date("2026-04-30T12:30:00.000Z");
    expect(computeStopDurationSec(start, end)).toBe(2 * 3600 + 30 * 60);
  });

  it("inicio y fin idénticos da 0", () => {
    expect(computeStopDurationSec(start, start)).toBe(0);
  });
});

describe("formatDurationSec", () => {
  it("devuelve '—' cuando es null", () => {
    expect(formatDurationSec(null)).toBe("—");
  });

  it("muestra solo segundos para duraciones < 1 minuto", () => {
    expect(formatDurationSec(0)).toBe("0s");
    expect(formatDurationSec(1)).toBe("1s");
    expect(formatDurationSec(45)).toBe("45s");
    expect(formatDurationSec(59)).toBe("59s");
  });

  it("muestra minutos y segundos para 1m..59m59s", () => {
    expect(formatDurationSec(60)).toBe("1m 0s");
    expect(formatDurationSec(90)).toBe("1m 30s");
    expect(formatDurationSec(3599)).toBe("59m 59s");
  });

  it("muestra horas y minutos para >= 1h y descarta segundos", () => {
    expect(formatDurationSec(3600)).toBe("1h 0m");
    expect(formatDurationSec(3660)).toBe("1h 1m");
    expect(formatDurationSec(3661)).toBe("1h 1m");
    expect(formatDurationSec(7200)).toBe("2h 0m");
    expect(formatDurationSec(8 * 3600 + 15 * 60 + 42)).toBe("8h 15m");
  });
});
