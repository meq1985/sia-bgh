export type Shift = "MORNING" | "AFTERNOON";

// Turno mañana 06:00–15:00, turno tarde 15:00–23:36 (con horas extra posibles).
// La autodetección sirve como sugerencia; el usuario puede sobrescribir.
export function defaultShiftForNow(date = new Date()): Shift {
  const h = date.getHours();
  return h >= 6 && h < 15 ? "MORNING" : "AFTERNOON";
}

export function shiftLabel(s: Shift): string {
  return s === "MORNING" ? "Mañana" : "Tarde";
}
