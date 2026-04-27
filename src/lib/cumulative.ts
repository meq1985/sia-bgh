type MagazineLite = {
  id: string;
  workOrderId: string;
  placasCount: number;
  createdAt: Date;
};

/**
 * Devuelve un Map<magazineId, acumulado> donde el acumulado es la suma
 * progresiva de placasCount dentro de la misma WO, ordenada cronológicamente.
 *
 * El input puede venir en cualquier orden — la función ordena internamente
 * por createdAt asc antes de calcular.
 */
export function cumulativeByMagazine(magazines: MagazineLite[]): Map<string, number> {
  const sorted = [...magazines].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );
  const cumulative = new Map<string, number>();
  const runningByWo = new Map<string, number>();
  for (const m of sorted) {
    const next = (runningByWo.get(m.workOrderId) ?? 0) + m.placasCount;
    runningByWo.set(m.workOrderId, next);
    cumulative.set(m.id, next);
  }
  return cumulative;
}
