import { describe, expect, it } from "vitest";
import { isWoComplete, producedFromMagazines } from "./wo";

describe("producedFromMagazines", () => {
  it("devuelve 0 con array vacío", () => {
    expect(producedFromMagazines([])).toBe(0);
  });

  it("suma placasCount", () => {
    expect(producedFromMagazines([{ placasCount: 17 }, { placasCount: 25 }])).toBe(42);
  });

  it("ignora otros campos del objeto", () => {
    const mags = [
      { placasCount: 10, foo: "bar" },
      { placasCount: 5, baz: 99 },
    ] as unknown as { placasCount: number }[];
    expect(producedFromMagazines(mags)).toBe(15);
  });
});

describe("isWoComplete", () => {
  it("false si producido < total", () => {
    expect(isWoComplete(40, 50)).toBe(false);
  });

  it("true si producido === total", () => {
    expect(isWoComplete(50, 50)).toBe(true);
  });

  it("true si producido > total (overshoot)", () => {
    expect(isWoComplete(65, 50)).toBe(true);
  });

  it("false si total = 0", () => {
    expect(isWoComplete(10, 0)).toBe(false);
  });

  it("false si producido = 0 y total > 0", () => {
    expect(isWoComplete(0, 50)).toBe(false);
  });
});
