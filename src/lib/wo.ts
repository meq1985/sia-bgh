export function panelsFromMagazines(mags: { placasCount: number }[]): number {
  return mags.reduce((s, m) => s + m.placasCount, 0);
}

export function producedPlacasFromMagazines(
  mags: { placasCount: number }[],
  troquel: number,
): number {
  return panelsFromMagazines(mags) * troquel;
}

export function isWoComplete(producedPlacas: number, totalQty: number): boolean {
  return totalQty > 0 && producedPlacas >= totalQty;
}
