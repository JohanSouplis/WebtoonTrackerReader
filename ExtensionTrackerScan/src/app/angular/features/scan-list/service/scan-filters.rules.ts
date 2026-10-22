import { ScanRow } from './scan-row.vm';

export type ScanFilters = {
  readonly favoritesOnly: boolean;
  readonly ratedOnly: boolean;
};

export const NO_FILTERS: ScanFilters = {
  favoritesOnly: false,
  ratedOnly: false,
};

export const filterScans = (
  scans: ScanRow[],
  filters: ScanFilters,
): ScanRow[] =>
  scans.filter(
    (scan) =>
      (!filters.favoritesOnly || scan.isFavorite) &&
      (!filters.ratedOnly || scan.rating !== undefined),
  );
