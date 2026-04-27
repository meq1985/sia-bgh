export function computeFpy(placas: number, defectivos: number): number | null {
  if (placas < 0 || defectivos < 0) return null;
  const denom = placas + defectivos;
  if (denom === 0) return null;
  return Math.round((placas / denom) * 1000) / 10;
}
