export type AppRole =
  | "ADMIN"
  | "SUPERVISOR"
  | "OPERADOR"
  | "MANTENIMIENTO"
  | "PROGRAMACION";

export const ALL_ROLES: AppRole[] = [
  "ADMIN",
  "SUPERVISOR",
  "OPERADOR",
  "MANTENIMIENTO",
  "PROGRAMACION",
];

export function canEditMagazines(role: AppRole): boolean {
  return role === "ADMIN" || role === "SUPERVISOR";
}

export function canManageMagazines(role: AppRole): boolean {
  return role === "ADMIN" || role === "SUPERVISOR";
}

export function canManageWorkOrders(role: AppRole): boolean {
  return role === "ADMIN" || role === "SUPERVISOR";
}

export function canValidateLineStop(role: AppRole): boolean {
  return (
    role === "ADMIN" ||
    role === "SUPERVISOR" ||
    role === "MANTENIMIENTO" ||
    role === "PROGRAMACION"
  );
}
