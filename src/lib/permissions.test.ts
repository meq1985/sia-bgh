import { describe, expect, it } from "vitest";
import {
  ALL_ROLES,
  canEditMagazines,
  canManageMagazines,
  canManageWorkOrders,
  canValidateLineStop,
  type AppRole,
} from "./permissions";

describe("ALL_ROLES", () => {
  it("expone los 5 roles del sistema", () => {
    expect(ALL_ROLES).toHaveLength(5);
    expect(new Set(ALL_ROLES)).toEqual(
      new Set<AppRole>([
        "ADMIN",
        "SUPERVISOR",
        "OPERADOR",
        "MANTENIMIENTO",
        "PROGRAMACION",
      ]),
    );
  });
});

describe("canEditMagazines", () => {
  it("ADMIN y SUPERVISOR pueden editar", () => {
    expect(canEditMagazines("ADMIN")).toBe(true);
    expect(canEditMagazines("SUPERVISOR")).toBe(true);
  });

  it("OPERADOR, MANTENIMIENTO y PROGRAMACION no pueden editar", () => {
    expect(canEditMagazines("OPERADOR")).toBe(false);
    expect(canEditMagazines("MANTENIMIENTO")).toBe(false);
    expect(canEditMagazines("PROGRAMACION")).toBe(false);
  });
});

describe("canValidateLineStop", () => {
  it("ADMIN, SUPERVISOR, MANTENIMIENTO y PROGRAMACION habilitan los botones de UI", () => {
    expect(canValidateLineStop("ADMIN")).toBe(true);
    expect(canValidateLineStop("SUPERVISOR")).toBe(true);
    expect(canValidateLineStop("MANTENIMIENTO")).toBe(true);
    expect(canValidateLineStop("PROGRAMACION")).toBe(true);
  });

  it("OPERADOR no puede validar", () => {
    expect(canValidateLineStop("OPERADOR")).toBe(false);
  });

  it("cada rol tiene una decisión booleana definida", () => {
    for (const role of ALL_ROLES) {
      expect(typeof canValidateLineStop(role)).toBe("boolean");
      expect(typeof canEditMagazines(role)).toBe("boolean");
    }
  });
});

describe("canManageMagazines / canManageWorkOrders", () => {
  it("ADMIN y SUPERVISOR pueden gestionar magazines y WOs", () => {
    expect(canManageMagazines("ADMIN")).toBe(true);
    expect(canManageMagazines("SUPERVISOR")).toBe(true);
    expect(canManageWorkOrders("ADMIN")).toBe(true);
    expect(canManageWorkOrders("SUPERVISOR")).toBe(true);
  });

  it("OPERADOR, MANTENIMIENTO y PROGRAMACION no pueden gestionar", () => {
    for (const r of ["OPERADOR", "MANTENIMIENTO", "PROGRAMACION"] as AppRole[]) {
      expect(canManageMagazines(r)).toBe(false);
      expect(canManageWorkOrders(r)).toBe(false);
    }
  });
});
