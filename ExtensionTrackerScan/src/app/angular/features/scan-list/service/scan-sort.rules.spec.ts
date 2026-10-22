import { aRow } from './scan-rows.fixture';
import { LATEST_READ_FIRST, sortBy, sortScans } from './scan-sort.rules';

describe('sortScans', () => {
  it('should put the latest read first by default', () => {
    expect(titles(sortScans(SCANS, LATEST_READ_FIRST))).toEqual([
      'duke Pendragon',
      'Solo Leveling',
      'Absolute Sword Sense',
    ]);
  });

  it('should sort titles alphabetically whatever their case', () => {
    expect(
      titles(sortScans(SCANS, { key: 'title', direction: 'asc' })),
    ).toEqual(['Absolute Sword Sense', 'duke Pendragon', 'Solo Leveling']);
  });

  it('should put the highest chapter first when sorting chapters descending', () => {
    expect(
      titles(sortScans(SCANS, { key: 'chapter', direction: 'desc' })),
    ).toEqual(['Solo Leveling', 'duke Pendragon', 'Absolute Sword Sense']);
  });

  it('should put unrated scans last when sorting ratings descending', () => {
    expect(
      titles(sortScans(SCANS, { key: 'rating', direction: 'desc' })),
    ).toEqual(['duke Pendragon', 'Absolute Sword Sense', 'Solo Leveling']);
  });

  it('should put favorites first when sorting favorites descending', () => {
    expect(
      titles(sortScans(SCANS, { key: 'favorite', direction: 'desc' })),
    ).toEqual(['Solo Leveling', 'Absolute Sword Sense', 'duke Pendragon']);
  });
});

describe('sortBy', () => {
  it.each`
    key           | direction
    ${'title'}    | ${'asc'}
    ${'chapter'}  | ${'desc'}
    ${'rating'}   | ${'desc'}
    ${'favorite'} | ${'desc'}
  `(
    'should start sorting $key $direction when another key was sorted',
    ({ key, direction }) => {
      expect(sortBy(LATEST_READ_FIRST, key)).toEqual({ key, direction });
    },
  );

  it('should flip the direction when the sorted key is picked again', () => {
    expect(sortBy(LATEST_READ_FIRST, 'readAt')).toEqual({
      key: 'readAt',
      direction: 'asc',
    });
  });
});

const titles = (scans: { title: string }[]): string[] =>
  scans.map((scan) => scan.title);

const SCANS = [
  aRow({
    title: 'Solo Leveling',
    chapter: 200,
    readAt: new Date('2024-07-13T09:45:30Z'),
    isFavorite: true,
  }),
  aRow({
    title: 'Absolute Sword Sense',
    chapter: 117,
    readAt: new Date('2024-01-04T09:35:10Z'),
    rating: 7,
  }),
  aRow({
    title: 'duke Pendragon',
    chapter: 120,
    readAt: new Date('2024-11-19T10:40:00Z'),
    rating: 9,
  }),
];
