import { Cover, Thumbnail } from '../domain/cover';
import { ScanTitle } from '../domain/scan-title';
import { ChromeStorageCoverRepository } from './chrome-storage-cover-repository.gateway';
import { FakeChromeStorage, installChrome } from './fake-chrome.fixture';

describe('ChromeStorageCoverRepository', () => {
  it('should find the covers it saved, under their own key per series', async () => {
    const storage = useStorage({});
    const repository = new ChromeStorageCoverRepository();

    await repository.update(ScanTitle.of('Solo Leveling'), () => FOUND);
    await repository.update(ScanTitle.of('Nano Machine'), () => MISSING);

    expect(
      await repository.find([
        ScanTitle.of('Solo Leveling'),
        ScanTitle.of('Nano Machine'),
        ScanTitle.of('The Breaker'),
      ]),
    ).toEqual(
      new Map([
        ['Solo Leveling', FOUND],
        ['Nano Machine', MISSING],
      ]),
    );
    expect(Object.keys(storage.items)).toEqual([
      'cover:solo leveling',
      'cover:nano machine',
    ]);
  });

  it('should find the cover of a series under a title written differently', async () => {
    useStorage({});
    const repository = new ChromeStorageCoverRepository();

    await repository.update(ScanTitle.of('The Solo Leveling'), () => FOUND);

    expect(await repository.find([ScanTitle.of('solo leveling!')])).toEqual(
      new Map([['solo leveling!', FOUND]]),
    );
  });

  it('should delete the stored cover of a series and keep the others', async () => {
    const storage = useStorage({});
    const repository = new ChromeStorageCoverRepository();
    await repository.update(ScanTitle.of('Solo Leveling'), () => FOUND);
    await repository.update(ScanTitle.of('Nano Machine'), () => MISSING);

    await repository.remove(ScanTitle.of('The Solo Leveling'));

    expect(Object.keys(storage.items)).toEqual(['cover:nano machine']);
  });

  it('should move the cover of a series to its new title and keep it when the key does not change', async () => {
    const storage = useStorage({});
    const repository = new ChromeStorageCoverRepository();
    await repository.update(ScanTitle.of('Punch'), () => FOUND);

    await repository.move(ScanTitle.of('Punch'), ScanTitle.of('One Punch-Man'));
    await repository.move(
      ScanTitle.of('One Punch-Man'),
      ScanTitle.of('ONE PUNCH MAN'),
    );
    await repository.move(ScanTitle.of('Punch'), ScanTitle.of('Eleceed'));

    expect(Object.keys(storage.items)).toEqual(['cover:one punch man']);
    expect(await repository.find([ScanTitle.of('One Punch-Man')])).toEqual(
      new Map([['One Punch-Man', FOUND]]),
    );
  });

  it('should apply each update to the cover the previous one stored, across repositories', async () => {
    useStorage({});
    const title = ScanTitle.of('Solo Leveling');

    await Promise.all([
      new ChromeStorageCoverRepository().update(title, () => FOUND),
      new ChromeStorageCoverRepository().update(
        title,
        (stored) => stored ?? MISSING,
      ),
    ]);

    expect(await new ChromeStorageCoverRepository().find([title])).toEqual(
      new Map([['Solo Leveling', FOUND]]),
    );
  });

  it.each`
    stored
    ${'data:image/webp;base64,AAAA'}
    ${{ kind: 'found', thumbnail: 'https://example.com/cover.jpg', from: 'page', at: '2025-03-10T12:00:00.000Z' }}
    ${{ kind: 'missing', triedAt: 'yesterday' }}
  `(
    'should ignore a stored cover it cannot read: $stored',
    async ({ stored }) => {
      useStorage({ 'cover:solo leveling': stored });

      const covers = await new ChromeStorageCoverRepository().find([
        ScanTitle.of('Solo Leveling'),
      ]);

      expect(covers.size).toBe(0);
    },
  );
});

const thumbnail = (): Thumbnail => {
  const parsed = Thumbnail.parse('data:image/webp;base64,UklGRg==');
  if (!parsed) {
    throw new Error('The thumbnail does not parse');
  }
  return parsed;
};

const FOUND: Cover = {
  kind: 'found',
  thumbnail: thumbnail(),
  from: 'series-page',
  at: new Date('2025-03-10T12:00:00Z'),
};

const MISSING: Cover = {
  kind: 'missing',
  triedAt: new Date('2025-03-10T12:00:00Z'),
};

const useStorage = (items: Record<string, unknown>): FakeChromeStorage => {
  const storage = new FakeChromeStorage(items);
  installChrome({ storage: { local: storage } });
  return storage;
};
