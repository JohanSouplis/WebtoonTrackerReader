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
        origin: 'unknown',
        isFavorite: true,
        rating: undefined,
      },
      {
        title: 'Solo Leveling',
        chapter: 12,
        url: 'url2.com',
        readAt: NaN,
        origin: 'unknown',
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
          origin: 'unknown',
          isFavorite: true,
          rating: 7,
        },
        {
          title: 'Solo Leveling',
          chapter: 12,
          url: 'url2.com',
          readAt: new Date(NaN),
          origin: 'unknown',
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
  it('should keep the aliases of a scan through a save and a load', async () => {
    const storage = useStorage({});
    const repository = new ChromeStorageScanRepository();
    const renamed = ScanLibrary.restore([
      {
        title: 'One Punch-Man',
        chapter: 200,
        url: 'url.com',
        readAt: new Date(STORED_DATE),
        origin: 'unknown',
        isFavorite: false,
        aliases: ['Punch', 'Onepunch'],
      },
    ]);

    await repository.save(renamed);

    expect(storage.items['scans']).toEqual([
      {
        title: 'One Punch-Man',
        chapter: '200',
        url: 'url.com',
        whenWasItRead: new Date(STORED_DATE).toString(),
        isFavorite: false,
        aliases: ['Punch', 'Onepunch'],
      },
    ]);
    expect((await repository.load()).snapshot()).toEqual(renamed.snapshot());
  });

  it('should ignore the stored aliases it cannot read', async () => {
    useStorage({
      scans: [
        {
          title: 'One Punch-Man',
          chapter: '200',
          url: 'url.com',
          whenWasItRead: STORED_DATE,
          isFavorite: false,
          aliases: ['Punch', 7, null],
        },
        {
          title: 'Eleceed',
          chapter: '2',
          url: 'url.com',
          whenWasItRead: STORED_DATE,
          isFavorite: false,
          aliases: 'Eleceed!',
        },
      ],
    });

    const library = await new ChromeStorageScanRepository().load();

    expect(library.snapshot()).toMatchObject([
      { title: 'One Punch-Man', aliases: ['Punch'] },
      { title: 'Eleceed', aliases: undefined },
    ]);
  });

  it('should merge on load two stored scans when one was stored under an alias of the other', async () => {
    useStorage({
      scans: [
        {
          title: 'One Punch-Man',
          chapter: '200',
          url: 'url.com',
          whenWasItRead: STORED_DATE,
          isFavorite: false,
          aliases: ['Punch'],
        },
        {
          title: 'Punch',
          chapter: '150',
          url: 'url.com',
          whenWasItRead: 'Sat Jun 01 2023 14:05:10 GMT+0200',
          isFavorite: true,
        },
      ],
    });

    const library = await new ChromeStorageScanRepository().load();

    expect(library.snapshot()).toMatchObject([
      {
        title: 'One Punch-Man',
        chapter: 200,
        isFavorite: true,
        aliases: ['Punch'],
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
          origin: 'unknown',
          isFavorite: false,
          seriesUrl,
        },
      ]),
    );

    expect((await repository.load()).snapshot()).toMatchObject([
      { title: 'Solo Leveling', seriesUrl },
    ]);
  });

  it('should keep a reading made on another device through a save and a load', async () => {
    const storage = useStorage({});
    const repository = new ChromeStorageScanRepository();

    await repository.save(
      ScanLibrary.restore([
        {
          title: 'Solo Leveling',
          chapter: 12,
          url: 'url2.com',
          readAt: new Date(STORED_DATE),
          origin: 'other-device',
          isFavorite: false,
        },
      ]),
    );

    expect(storage.items['scans']).toMatchObject([
      { title: 'Solo Leveling', readOn: 'other-device' },
    ]);
    expect((await repository.load()).snapshot()).toMatchObject([
      { title: 'Solo Leveling', origin: 'other-device' },
    ]);
  });

  it('should read an unknown origin when the stored device is not one it knows', async () => {
    useStorage({
      scans: [
        {
          title: 'Solo Leveling',
          chapter: '12',
          url: 'url2.com',
          whenWasItRead: STORED_DATE,
          isFavorite: false,
          readOn: 'tablet',
        },
      ],
    });

    const library = await new ChromeStorageScanRepository().load();

    expect(library.snapshot()).toMatchObject([
      { title: 'Solo Leveling', origin: 'unknown' },
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
