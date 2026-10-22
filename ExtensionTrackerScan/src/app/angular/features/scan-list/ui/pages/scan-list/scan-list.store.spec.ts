import { aScan } from '../../../../../../core/use-cases/scans.fixture';
import { ScanListStore } from './scan-list.store';

describe('ScanListStore', () => {
  it('should show a scan under Favorites Only when it was favorited after the library was shown', () => {
    const store = new ScanListStore();
    store.showLibrary([
      aScan({ title: 'Solo leveling' }),
      aScan({ title: 'Omniscient reader' }),
    ]);

    store.toggleFavorite(store.scans()[0]);
    store.applyFilters({ favoritesOnly: true, ratedOnly: false });

    expect(store.scans().map((scan) => scan.title)).toEqual(['Solo leveling']);
  });

  it('should show a scan under Rating Only when it was rated after the library was shown', () => {
    const store = new ScanListStore();
    store.showLibrary([
      aScan({ title: 'Solo leveling' }),
      aScan({ title: 'Omniscient reader' }),
    ]);

    store.rate(store.scans()[1], 8);
    store.applyFilters({ favoritesOnly: false, ratedOnly: true });

    expect(store.scans()).toEqual([
      expect.objectContaining({ title: 'Omniscient reader', rating: 8 }),
    ]);
  });
});
