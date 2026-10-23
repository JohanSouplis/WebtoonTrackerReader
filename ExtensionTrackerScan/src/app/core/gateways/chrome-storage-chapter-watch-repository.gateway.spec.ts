import { ChapterWatch } from '../domain/chapter-watch';
import { ScanTitle } from '../domain/scan-title';
import { ChromeStorageChapterWatchRepository } from './chrome-storage-chapter-watch-repository.gateway';
import { FakeChromeStorage, installChrome } from './fake-chrome.fixture';

const AT = new Date('2026-10-23T10:00:00Z');

describe('ChromeStorageChapterWatchRepository', () => {
  it.each<ChapterWatch>([
    { kind: 'up-to-date', site: 'scans.org', latest: 12, checkedAt: AT },
    {
      kind: 'new',
      site: 'scans.org',
      latest: 13.5,
      url: 'https://scans.org/solo-leveling/chapter-13-5',
      foundAt: AT,
      checkedAt: AT,
    },
    { kind: 'new', site: 'scans.org', latest: 13, foundAt: AT, checkedAt: AT },
    {
      kind: 'unsupported',
      site: 'scans.org',
      reason: 'script-only',
      checkedAt: AT,
    },
    {
      kind: 'failing',
      site: 'scans.org',
      since: AT,
      attempts: 2,
      nextAttemptAt: AT,
      lastKnown: {
        kind: 'up-to-date',
        site: 'scans.org',
        latest: 12,
        checkedAt: AT,
      },
    },
  ])(
    'should find the $kind watch it saved under its series key',
    async (watch) => {
      const storage = useStorage({});
      const repository = new ChromeStorageChapterWatchRepository();

      await repository.save(ScanTitle.of('The Solo Leveling'), watch);

      expect(await repository.find([ScanTitle.of('solo leveling!')])).toEqual(
        new Map([['solo leveling!', watch]]),
      );
      expect(Object.keys(storage.items)).toEqual(['watch:solo leveling']);
    },
  );

  it('should delete the watch of a series and keep the others', async () => {
    const storage = useStorage({});
    const repository = new ChromeStorageChapterWatchRepository();
    await repository.save(ScanTitle.of('Solo Leveling'), UP_TO_DATE);
    await repository.save(ScanTitle.of('Nano Machine'), UP_TO_DATE);

    await repository.remove(ScanTitle.of('Solo Leveling'));

    expect(Object.keys(storage.items)).toEqual(['watch:nano machine']);
  });

  it.each`
    stored
    ${'new'}
    ${{ kind: 'new', site: 'scans.org', latest: '13', foundAt: '2026-10-23T10:00:00.000Z', checkedAt: '2026-10-23T10:00:00.000Z' }}
    ${{ kind: 'unsupported', site: 'scans.org', reason: 'paywall', checkedAt: '2026-10-23T10:00:00.000Z' }}
    ${{ kind: 'up-to-date', latest: 12, checkedAt: '2026-10-23T10:00:00.000Z' }}
  `(
    'should ignore a stored watch it cannot read: $stored',
    async ({ stored }) => {
      useStorage({ 'watch:solo leveling': stored });

      const watches = await new ChromeStorageChapterWatchRepository().find([
        ScanTitle.of('Solo Leveling'),
      ]);

      expect(watches.size).toBe(0);
    },
  );
});

const UP_TO_DATE: ChapterWatch = {
  kind: 'up-to-date',
  site: 'scans.org',
  latest: 12,
  checkedAt: AT,
};

const useStorage = (items: Record<string, unknown>): FakeChromeStorage => {
  const storage = new FakeChromeStorage(items);
  installChrome({ storage: { local: storage } });
  return storage;
};
