export type Shift = "MORNING" | "AFTERNOON";

export function defaultShiftForNow(date = new Date()): Shift {
  const h = date.getHours();
  return h >= 6 && h < 14 ? "MORNING" : "AFTERNOON";
}

export function shiftLabel(s: Shift): string {
  return s === "MORNING" ? "Mañana" : "Tarde";
}
