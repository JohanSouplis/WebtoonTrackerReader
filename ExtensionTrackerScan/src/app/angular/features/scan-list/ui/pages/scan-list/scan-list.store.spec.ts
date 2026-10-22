import { ScanSnapshot } from '../../../../../../core/domain/scan-library';
import { aScan } from '../../../../../../core/use-cases/scans.fixture';
import { NO_FILTERS } from '../../../service/scan-filters.rules';
import { ScanListView } from '../../../service/scan-list-view.vm';
import { ScanListStore } from './scan-list.store';

describe('ScanListStore', () => {
  it('should show nothing until the library is loaded', () => {
    expect(new ScanListStore().view()).toEqual({ kind: 'loading' });
  });

  it('should say the library is empty when it holds no scan', () => {
    const store = new ScanListStore();

    store.showLibrary([]);

    expect(store.view()).toEqual({ kind: 'empty-library' });
  });

  it('should show the ten latest reads on the first page', () => {
    const store = new ScanListStore();

    store.showLibrary(TWELVE_SCANS);

    expect(shownTitles(store.view())).toEqual(
      ['12', '11', '10', '9', '8', '7', '6', '5', '4', '3'].map(titleOf),
    );
    expect(store.count()).toBe(12);
  });

  it('should keep the filters and the sort when the library changes after a delete', () => {
    const store = new ScanListStore();
    store.showLibrary(TWELVE_SCANS);
    store.filter({ ...NO_FILTERS, favoritesOnly: true });
    store.sortBy('title');

    store.showLibrary(
      TWELVE_SCANS.filter((scan) => scan.title !== titleOf('2')),
    );

    expect(shownTitles(store.view())).toEqual(
      ['10', '12', '4', '6', '8'].map(titleOf),
    );
  });

  it('should hide a scan from Favorites only when it is unfavorited', () => {
    const store = new ScanListStore();
    store.showLibrary([
      aScan({ title: 'Solo Leveling', isFavorite: true }),
      aScan({ title: 'Duke Pendragon', isFavorite: true }),
    ]);
    store.filter({ ...NO_FILTERS, favoritesOnly: true });

    store.showLibrary([
      aScan({ title: 'Solo Leveling', isFavorite: false }),
      aScan({ title: 'Duke Pendragon', isFavorite: true }),
    ]);

    expect(shownTitles(store.view())).toEqual(['Duke Pendragon']);
  });

  it('should show a scan under Rated only once it is rated', () => {
    const store = new ScanListStore();
    store.showLibrary([aScan({ title: 'Solo Leveling' })]);
    store.filter({ ...NO_FILTERS, ratedOnly: true });

    store.showLibrary([aScan({ title: 'Solo Leveling', rating: 8 })]);

    expect(shownTitles(store.view())).toEqual(['Solo Leveling']);
  });

  it('should go back to the first page when the filters change', () => {
    const store = new ScanListStore();
    store.showLibrary(TWELVE_SCANS);
    store.turnPage({ index: 1, size: 10 });

    store.filter({ ...NO_FILTERS, title: 'scan' });

    expect(store.view()).toEqual(
      expect.objectContaining({ page: { index: 0, size: 10 } }),
    );
  });

  it('should show the last page that still exists when its scans are gone', () => {
    const store = new ScanListStore();
    store.showLibrary(TWELVE_SCANS);
    store.turnPage({ index: 1, size: 10 });

    store.showLibrary(TWELVE_SCANS.slice(2));

    expect(store.view()).toEqual(
      expect.objectContaining({ page: { index: 0, size: 10 }, length: 10 }),
    );
  });

  it('should keep the page size when the sort changes', () => {
    const store = new ScanListStore();
    store.showLibrary(TWELVE_SCANS);
    store.turnPage({ index: 2, size: 5 });

    store.sortBy('chapter');

    expect(store.view()).toEqual(
      expect.objectContaining({ page: { index: 0, size: 5 } }),
    );
  });

  it('should say which title matched nothing when no scan matches', () => {
    const store = new ScanListStore();
    store.showLibrary(TWELVE_SCANS);

    store.filter({ ...NO_FILTERS, title: ' zzz ' });

    expect(store.view()).toEqual({ kind: 'no-match', searchedTitle: 'zzz' });
    expect(store.count()).toBe(0);
  });

  it('should keep the typed title when Favorites only is pressed', () => {
    const store = new ScanListStore();
    store.showLibrary(TWELVE_SCANS);
    store.filter({ title: 'zzzz' });

    store.filter({ favoritesOnly: true });

    expect(store.filters()).toEqual({
      title: 'zzzz',
      favoritesOnly: true,
      ratedOnly: false,
    });
    expect(store.view()).toEqual({ kind: 'no-match', searchedTitle: 'zzzz' });
  });

  it('should show the whole library again when the filters are cleared', () => {
    const store = new ScanListStore();
    store.showLibrary(TWELVE_SCANS);
    store.filter({ title: 'zzz', favoritesOnly: true, ratedOnly: true });

    store.clearFilters();

    expect(store.filters()).toEqual(NO_FILTERS);
    expect(store.count()).toBe(12);
  });
});

const titleOf = (number: string): string => `Scan ${number}`;

const TWELVE_SCANS: ScanSnapshot[] = Array.from({ length: 12 }, (_, index) =>
  aScan({
    title: titleOf(String(index + 1)),
    readAt: new Date(Date.UTC(2024, 0, index + 1)),
    isFavorite: index % 2 === 1,
  }),
);

const shownTitles = (view: ScanListView): string[] =>
  view.kind === 'scans' ? view.rows.map((row) => row.title) : [];
