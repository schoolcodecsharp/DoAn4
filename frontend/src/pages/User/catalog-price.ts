import type { CatalogItem, Kind } from './catalog';

// Zero is only a confirmed price when admission is explicitly free.
export function catalogPrice(item: CatalogItem, kind: Kind): number | null {
  if (kind === 'destinations' && item.mienPhi) return 0;
  const value = kind === 'tours' ? item.giaTour : kind === 'hotels' ? item.giaPhongMin : kind === 'restaurants' ? item.giaMin : item.giaVe;
  return value !== undefined && Number.isFinite(value) && value > 0 ? value : null;
}

export function matchesBudget(price: number | null, min: number, max: number) {
  if (!min && !max) return true;
  return price !== null && price >= min && (!max || price <= max);
}
