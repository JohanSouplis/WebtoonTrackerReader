import { filterScans, NO_FILTERS } from './scan-filters.rules';
import { aRow } from './scan-rows.fixture';

describe('filterScans', () => {
  it('should keep every scan when no filter is set', () => {
    expect(filterScans(SCANS, NO_FILTERS)).toEqual(SCANS);
  });

  it('should keep only favorite scans when Following only is on', () => {
    expect(filterScans(SCANS, { ...NO_FILTERS, favoritesOnly: true })).toEqual([
      SOLO_LEVELING,
      DUKE_PENDRAGON,
    ]);
  });

  it('should keep only rated scans when Rated only is on', () => {
    expect(filterScans(SCANS, { ...NO_FILTERS, ratedOnly: true })).toEqual([
      SSS_CLASS_HUNTER,
      DUKE_PENDRAGON,
    ]);
  });

  it('should keep scans whose title contains the search, whatever its case and surrounding spaces', () => {
    expect(filterScans(SCANS, { ...NO_FILTERS, title: '  sss ' })).toEqual([
      SSS_CLASS_HUNTER,
    ]);
  });

  it('should match the title only, never the url or the website', () => {
    expect(filterScans(SCANS, { ...NO_FILTERS, title: 'asura' })).toEqual([]);
  });

  it('should keep only scans matching every filter when they are combined', () => {
    expect(
      filterScans(SCANS, { ...NO_FILTERS, title: 'd', favoritesOnly: true }),
    ).toEqual([DUKE_PENDRAGON]);
    expect(
      filterScans(SCANS, { title: 's', favoritesOnly: true, ratedOnly: true }),
    ).toEqual([]);
  });
});

const SOLO_LEVELING = aRow({ title: 'Solo Leveling', isFavorite: true });
const SSS_CLASS_HUNTER = aRow({ title: 'SSS-Class Hunter', rating: 7 });
const DUKE_PENDRAGON = aRow({
  title: 'Duke Pendragon',
  isFavorite: true,
  rating: 9,
});
const DUNGEON_ODYSSEY = aRow({ title: 'Dungeon Odyssey' });
const SCANS = [
  SOLO_LEVELING,
  SSS_CLASS_HUNTER,
  DUKE_PENDRAGON,
  DUNGEON_ODYSSEY,
];
