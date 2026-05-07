export function producedFromMagazines(mags: { placasCount: number }[]): number {
  return mags.reduce((s, m) => s + m.placasCount, 0);
}

export function isWoComplete(produced: number, totalQty: number): boolean {
  return totalQty > 0 && produced >= totalQty;
}
