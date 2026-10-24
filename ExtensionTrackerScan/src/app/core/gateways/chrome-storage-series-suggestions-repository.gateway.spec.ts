import {
  SeriesSuggestions,
  SeriesSuggestionsSnapshot,
} from '../domain/series-suggestions';
import { ChromeStorageSeriesSuggestionsRepository } from './chrome-storage-series-suggestions-repository.gateway';
import { FakeChromeStorage, installChrome } from './fake-chrome.fixture';

describe('ChromeStorageSeriesSuggestionsRepository', () => {
  it('should load the series it saved, dates and what each site learned included', async () => {
    useStorage({});
    const repository = new ChromeStorageSeriesSuggestionsRepository();

    await repository.save(SeriesSuggestions.restore(SAVED));

    expect((await repository.load()).snapshot()).toEqual(SAVED);
  });

  it('should load no series when none is stored yet', async () => {
    useStorage({});

    expect(
      (await new ChromeStorageSeriesSuggestionsRepository().load()).snapshot(),
    ).toEqual({ pending: [], hosts: [] });
  });

  it('should leave out what it cannot read and keep the rest', async () => {
    useStorage({
      'series-suggestions': {
        pending: [
          { ...STORED_SERIES, seenAt: 'yesterday' },
          { ...STORED_SERIES, chapter: '12' },
          { ...STORED_SERIES, source: 'bookmark' },
          { ...STORED_SERIES, title: '' },
          STORED_SERIES,
          'Solo Leveling',
        ],
        hosts: [
          { confirmedInARow: 1 },
          { host: 'b.example', confirmedInARow: -3, dismissedTitles: [3, 'x'] },
        ],
      },
    });

    expect(
      (await new ChromeStorageSeriesSuggestionsRepository().load()).snapshot(),
    ).toEqual({
      pending: [{ ...STORED_SERIES, seenAt: new Date(STORED_SERIES.seenAt) }],
      hosts: [
        {
          host: 'b.example',
          confirmedInARow: 0,
          dismissedInARow: 0,
          dismissedTitles: ['x'],
        },
      ],
    });
  });
});

const STORED_SERIES = {
  title: 'Solo Leveling',
  chapter: 56,
  url: 'https://a.example/solo-leveling/chapter-56',
  host: 'a.example',
  seenAt: '2025-03-10T12:00:00.000Z',
  source: 'page',
};

const SAVED: SeriesSuggestionsSnapshot = {
  pending: [
    {
      title: 'Solo Leveling',
      chapter: 56.5,
      url: 'https://a.example/solo-leveling/chapter-56-5',
      host: 'a.example',
      seenAt: new Date('2025-03-10T12:00:00Z'),
      source: 'history',
      seriesUrl: 'https://a.example/solo-leveling/',
    },
  ],
  hosts: [
    {
      host: 'a.example',
      confirmedInARow: 1,
      dismissedInARow: 0,
      dismissedTitles: ['doberman online free'],
    },
  ],
};

const useStorage = (items: Record<string, unknown>): FakeChromeStorage => {
  const storage = new FakeChromeStorage(items);
  installChrome({ storage: { local: storage } });
  return storage;
};
