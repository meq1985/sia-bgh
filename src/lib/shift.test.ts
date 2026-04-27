import { describe, expect, it } from "vitest";
import { defaultShiftForNow, shiftLabel } from "./shift";

function at(h: number, m = 0): Date {
  const d = new Date(2026, 0, 1, h, m, 0, 0);
  return d;
}

describe("defaultShiftForNow", () => {
  it("06:00 inclusivo es MORNING", () => {
    expect(defaultShiftForNow(at(6, 0))).toBe("MORNING");
  });

  it("13:59 sigue siendo MORNING", () => {
    expect(defaultShiftForNow(at(13, 59))).toBe("MORNING");
  });

  it("14:00 exacto pasa a AFTERNOON", () => {
    expect(defaultShiftForNow(at(14, 0))).toBe("AFTERNOON");
  });

  it("05:59 es AFTERNOON (madrugada cae en el turno tarde por diseño)", () => {
    expect(defaultShiftForNow(at(5, 59))).toBe("AFTERNOON");
  });

  it("medianoche es AFTERNOON", () => {
    expect(defaultShiftForNow(at(0, 0))).toBe("AFTERNOON");
  });
});

describe("shiftLabel", () => {
  it("traduce MORNING a Mañana", () => {
    expect(shiftLabel("MORNING")).toBe("Mañana");
  });

  it("traduce AFTERNOON a Tarde", () => {
    expect(shiftLabel("AFTERNOON")).toBe("Tarde");
  });
});
