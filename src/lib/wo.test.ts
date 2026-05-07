import { describe, expect, it } from "vitest";
import {
  isWoComplete,
  panelsFromMagazines,
  producedPlacasFromMagazines,
} from "./wo";

describe("panelsFromMagazines", () => {
  it("devuelve 0 con array vacío", () => {
    expect(panelsFromMagazines([])).toBe(0);
  });

  it("suma placasCount (cada item representa paneles)", () => {
    expect(panelsFromMagazines([{ placasCount: 17 }, { placasCount: 25 }])).toBe(42);
  });

  it("ignora otros campos del objeto", () => {
    const mags = [
      { placasCount: 10, foo: "bar" },
      { placasCount: 5, baz: 99 },
    ] as unknown as { placasCount: number }[];
    expect(panelsFromMagazines(mags)).toBe(15);
  });
});

describe("producedPlacasFromMagazines", () => {
  it("multiplica paneles por troquel", () => {
    expect(producedPlacasFromMagazines([{ placasCount: 25 }], 4)).toBe(100);
  });

  it("troquel = 1 mantiene el resultado igual a paneles", () => {
    expect(producedPlacasFromMagazines([{ placasCount: 25 }, { placasCount: 17 }], 1)).toBe(42);
  });

  it("troquel = 0 da 0 placas", () => {
    expect(producedPlacasFromMagazines([{ placasCount: 25 }], 0)).toBe(0);
  });

  it("array vacío da 0 sin importar troquel", () => {
    expect(producedPlacasFromMagazines([], 4)).toBe(0);
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
