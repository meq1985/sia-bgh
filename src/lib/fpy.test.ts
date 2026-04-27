import { describe, expect, it } from "vitest";
import { computeFpy } from "./fpy";

describe("computeFpy", () => {
  it("devuelve null cuando placas y defectivos son 0", () => {
    expect(computeFpy(0, 0)).toBeNull();
  });

  it("devuelve 100 cuando no hay defectivos", () => {
    expect(computeFpy(50, 0)).toBe(100);
  });

  it("devuelve 0 cuando todas son defectivas", () => {
    expect(computeFpy(0, 10)).toBe(0);
  });

  it("calcula porcentaje con un decimal", () => {
    expect(computeFpy(95, 5)).toBe(95);
    expect(computeFpy(100, 3)).toBe(97.1);
    expect(computeFpy(2, 1)).toBe(66.7);
  });

  it("rechaza inputs negativos devolviendo null", () => {
    expect(computeFpy(-1, 5)).toBeNull();
    expect(computeFpy(5, -1)).toBeNull();
  });

  it("trata números grandes sin perder precisión razonable", () => {
    expect(computeFpy(99_999, 1)).toBe(100);
    expect(computeFpy(50_000, 50_000)).toBe(50);
  });
});
