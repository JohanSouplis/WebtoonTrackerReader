import { filterScans, NO_FILTERS } from './scan-filters.rules';
import { ScanRow } from './scan-row.vm';

describe('filterScans', () => {
  it('should keep every scan when no filter is checked', () => {
    expect(filterScans(SCANS, NO_FILTERS)).toEqual(SCANS);
  });

  it('should keep only favorite scans when Favorites Only is checked', () => {
    expect(
      filterScans(SCANS, { favoritesOnly: true, ratedOnly: false }),
    ).toEqual([FAVORITE, RATED_FAVORITE]);
  });

  it('should keep only rated scans when Rating Only is checked', () => {
    expect(
      filterScans(SCANS, { favoritesOnly: false, ratedOnly: true }),
    ).toEqual([RATED, RATED_FAVORITE]);
  });

  it('should keep only rated favorite scans when both filters are checked', () => {
    expect(
      filterScans(SCANS, { favoritesOnly: true, ratedOnly: true }),
    ).toEqual([RATED_FAVORITE]);
  });
});

const aRow = (row: Partial<ScanRow>): ScanRow => ({
  title: 'Title',
  chapter: 1,
  url: 'url.com',
  readAt: new Date('2024-06-01T13:05:10Z'),
  isFavorite: false,
  ...row,
});

const PLAIN = aRow({ title: 'Plain' });
const FAVORITE = aRow({ title: 'Favorite', isFavorite: true });
const RATED = aRow({ title: 'Rated', rating: 7 });
const RATED_FAVORITE = aRow({
  title: 'Rated favorite',
  isFavorite: true,
  rating: 9,
});
const SCANS = [PLAIN, FAVORITE, RATED, RATED_FAVORITE];
