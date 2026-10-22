import { ScanRow } from './scan-row.vm';

export type ScanFilters = {
  readonly title: string;
  readonly favoritesOnly: boolean;
  readonly ratedOnly: boolean;
};

export const NO_FILTERS: ScanFilters = {
  title: '',
  favoritesOnly: false,
  ratedOnly: false,
};

export const filterScans = (
  scans: readonly ScanRow[],
  filters: ScanFilters,
): ScanRow[] => {
  const title = filters.title.trim().toLowerCase();
  return scans.filter(
    (scan) =>
      scan.title.toLowerCase().includes(title) &&
      (!filters.favoritesOnly || scan.isFavorite) &&
      (!filters.ratedOnly || scan.rating !== undefined),
  );
};
