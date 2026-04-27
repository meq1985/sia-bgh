import { describe, expect, it } from "vitest";
import { cumulativeByMagazine } from "./cumulative";

function mag(
  id: string,
  workOrderId: string,
  placasCount: number,
  createdAt: string,
) {
  return { id, workOrderId, placasCount, createdAt: new Date(createdAt) };
}

describe("cumulativeByMagazine", () => {
  it("devuelve un Map vacío para input vacío", () => {
    expect(cumulativeByMagazine([])).toEqual(new Map());
  });

  it("acumula placas dentro de la misma WO en orden cronológico", () => {
    const result = cumulativeByMagazine([
      mag("m1", "wo1", 25, "2026-01-01T08:00"),
      mag("m2", "wo1", 25, "2026-01-01T09:00"),
      mag("m3", "wo1", 50, "2026-01-01T10:00"),
    ]);
    expect(result.get("m1")).toBe(25);
    expect(result.get("m2")).toBe(50);
    expect(result.get("m3")).toBe(100);
  });

  it("no mezcla acumulados entre WOs distintas", () => {
    const result = cumulativeByMagazine([
      mag("a1", "woA", 10, "2026-01-01T08:00"),
      mag("b1", "woB", 100, "2026-01-01T08:30"),
      mag("a2", "woA", 20, "2026-01-01T09:00"),
      mag("b2", "woB", 50, "2026-01-01T10:00"),
    ]);
    expect(result.get("a1")).toBe(10);
    expect(result.get("a2")).toBe(30);
    expect(result.get("b1")).toBe(100);
    expect(result.get("b2")).toBe(150);
  });

  it("ordena internamente — input desordenado da el mismo resultado", () => {
    const ordered = cumulativeByMagazine([
      mag("m1", "wo1", 25, "2026-01-01T08:00"),
      mag("m2", "wo1", 25, "2026-01-01T09:00"),
      mag("m3", "wo1", 50, "2026-01-01T10:00"),
    ]);
    const shuffled = cumulativeByMagazine([
      mag("m3", "wo1", 50, "2026-01-01T10:00"),
      mag("m1", "wo1", 25, "2026-01-01T08:00"),
      mag("m2", "wo1", 25, "2026-01-01T09:00"),
    ]);
    expect(shuffled).toEqual(ordered);
  });

  it("no muta el array original", () => {
    const input = [
      mag("m2", "wo1", 25, "2026-01-01T09:00"),
      mag("m1", "wo1", 25, "2026-01-01T08:00"),
    ];
    const before = input.map((m) => m.id);
    cumulativeByMagazine(input);
    expect(input.map((m) => m.id)).toEqual(before);
  });
});
