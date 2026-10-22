import { ScanRow } from './scan-row.vm';

export type ScanSortKey =
  | 'readAt'
  | 'title'
  | 'chapter'
  | 'rating'
  | 'favorite';

export type SortDirection = 'asc' | 'desc';

export type ScanSort = {
  readonly key: ScanSortKey;
  readonly direction: SortDirection;
};

type SortRule = {
  readonly firstDirection: SortDirection;
  readonly compare: (left: ScanRow, right: ScanRow) => number;
};

const byNumber =
  (value: (scan: ScanRow) => number) =>
  (left: ScanRow, right: ScanRow): number =>
    value(left) - value(right);

const SORT_RULES: Record<ScanSortKey, SortRule> = {
  readAt: {
    firstDirection: 'desc',
    compare: byNumber((scan) => scan.readAt.getTime()),
  },
  title: {
    firstDirection: 'asc',
    compare: (left, right) =>
      left.title.localeCompare(right.title, 'en', { sensitivity: 'base' }),
  },
  chapter: {
    firstDirection: 'desc',
    compare: byNumber((scan) => scan.chapter),
  },
  rating: {
    firstDirection: 'desc',
    compare: byNumber((scan) => scan.rating ?? 0),
  },
  favorite: {
    firstDirection: 'desc',
    compare: byNumber((scan) => Number(scan.isFavorite)),
  },
};

export const LATEST_READ_FIRST: ScanSort = { key: 'readAt', direction: 'desc' };

export const sortScans = (
  scans: readonly ScanRow[],
  { key, direction }: ScanSort,
): ScanRow[] => {
  const sign = direction === 'asc' ? 1 : -1;
  return [...scans].sort(
    (left, right) => sign * SORT_RULES[key].compare(left, right),
  );
};

export const sortBy = (current: ScanSort, key: ScanSortKey): ScanSort => {
  if (current.key !== key) {
    return { key, direction: SORT_RULES[key].firstDirection };
  }
  return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
};
