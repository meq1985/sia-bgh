export type StopCategory = "OPERATOR" | "MAINTENANCE" | "PROGRAMMER";

export type StopCode = {
  code: number;
  label: string;
  category: StopCategory;
};

export const STOP_CODES: StopCode[] = [
  { code: 1, label: "Control de carga", category: "OPERATOR" },
  { code: 2, label: "Inspección de muestra", category: "OPERATOR" },
  { code: 3, label: "Puesta a punto", category: "OPERATOR" },
  { code: 4, label: "Referenciación de máquina", category: "OPERATOR" },
  { code: 5, label: "Recambio de consumibles", category: "OPERATOR" },
  { code: 6, label: "Sin operador", category: "OPERATOR" },
  { code: 7, label: "Calidad del material", category: "OPERATOR" },
  { code: 8, label: "Falta de material", category: "OPERATOR" },
  { code: 9, label: "Cambio de modelo programado", category: "OPERATOR" },
  { code: 10, label: "Cambios no programados", category: "OPERATOR" },
  { code: 11, label: "Asambleas / Otros / Gremio", category: "OPERATOR" },
  { code: 12, label: "Espera de placas / TH", category: "OPERATOR" },
  { code: 13, label: "Servicio externo a BGH", category: "MAINTENANCE" },
  { code: 14, label: "Mantenimiento preventivo", category: "MAINTENANCE" },
  { code: 15, label: "Mantenimiento correctivo", category: "MAINTENANCE" },
  { code: 16, label: "Energía eléctrica / servicios", category: "MAINTENANCE" },
  { code: 17, label: "Ajuste programa / Programador", category: "PROGRAMMER" },
  { code: 18, label: "Lanzamientos / Programador", category: "PROGRAMMER" },
];

export const VALID_STOP_CODES = new Set(STOP_CODES.map((s) => s.code));

export function stopCodeInfo(code: number): StopCode | undefined {
  return STOP_CODES.find((s) => s.code === code);
}

export function categoryForCode(code: number): StopCategory | null {
  return stopCodeInfo(code)?.category ?? null;
}

export function categoryLabel(c: StopCategory): string {
  return c === "OPERATOR" ? "Operador" : c === "MAINTENANCE" ? "Mantenimiento" : "Programador";
}

export function computeStopDurationSec(startedAt: Date, endedAt: Date | null): number | null {
  if (!endedAt) return null;
  const diff = endedAt.getTime() - startedAt.getTime();
  return diff < 0 ? 0 : Math.round(diff / 1000);
}

export function formatDurationSec(secs: number | null): string {
  if (secs === null) return "—";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
