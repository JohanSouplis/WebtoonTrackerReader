import { ScanLibrary } from '../domain/scan-library';
import { ChromeStorageScanRepository } from './chrome-storage-scan-repository.gateway';
import { FakeChromeStorage, installChrome } from './fake-chrome.fixture';

describe('ChromeStorageScanRepository', () => {
  it('should read the scans stored by the published version', async () => {
    useStorage({
      scans: [
        {
          title: 'Martial Peak',
          chapter: '489.1',
          url: 'url.com',
          whenWasItRead: STORED_DATE,
          isFavorite: true,
        },
        {
          title: 'Solo Leveling',
          chapter: '12',
          url: 'url2.com',
          whenWasItRead: '',
          isFavorite: false,
          rating: 9,
        },
      ],
    });

    const library = await new ChromeStorageScanRepository().load();

    expect(
      library
        .snapshot()
        .map((scan) => ({ ...scan, readAt: scan.readAt.getTime() })),
    ).toEqual([
      {
        title: 'Martial Peak',
        chapter: 489.1,
        url: 'url.com',
        readAt: new Date(STORED_DATE).getTime(),
        isFavorite: true,
        rating: undefined,
      },
      {
        title: 'Solo Leveling',
        chapter: 12,
        url: 'url2.com',
        readAt: NaN,
        isFavorite: false,
        rating: 9,
      },
    ]);
  });

  it('should read an empty library when no scan was ever stored', async () => {
    useStorage({});

    const library = await new ChromeStorageScanRepository().load();

    expect(library.snapshot()).toEqual([]);
  });

  it('should store the scans in the format of the published version', async () => {
    const storage = useStorage({});
    const readAt = new Date(STORED_DATE);

    await new ChromeStorageScanRepository().save(
      ScanLibrary.restore([
        {
          title: 'Martial Peak',
          chapter: 489.1,
          url: 'url.com',
          readAt,
          isFavorite: true,
          rating: 7,
        },
        {
          title: 'Solo Leveling',
          chapter: 12,
          url: 'url2.com',
          readAt: new Date(NaN),
          isFavorite: false,
        },
      ]),
    );

    expect(storage.items['scans']).toEqual([
      {
        title: 'Martial Peak',
        chapter: '489.1',
        url: 'url.com',
        whenWasItRead: readAt.toString(),
        isFavorite: true,
        rating: 7,
      },
      {
        title: 'Solo Leveling',
        chapter: '12',
        url: 'url2.com',
        whenWasItRead: '',
        isFavorite: false,
      },
    ]);
  });
  it('should keep the series page of a scan through a save and a load', async () => {
    useStorage({});
    const repository = new ChromeStorageScanRepository();
    const seriesUrl = 'https://asuracomic.net/series/solo-leveling';

    await repository.save(
      ScanLibrary.restore([
        {
          title: 'Solo Leveling',
          chapter: 12,
          url: 'url2.com',
          readAt: new Date(STORED_DATE),
          isFavorite: false,
          seriesUrl,
        },
      ]),
    );

    expect((await repository.load()).snapshot()).toMatchObject([
      { title: 'Solo Leveling', seriesUrl },
    ]);
  });
});

const STORED_DATE =
  'Sat Jun 01 2024 14:05:10 GMT+0200 (Central European Summer Time)';

const useStorage = (items: Record<string, unknown>): FakeChromeStorage => {
  const storage = new FakeChromeStorage(items);
  installChrome({ storage: { local: storage } });
  return storage;
};
