import { ChapterWatch } from '../domain/chapter-watch';
import { Cover } from '../domain/cover';
import {
  ScanNotFound,
  ScanSnapshot,
  SeriesAlreadyTracked,
} from '../domain/scan-library';
import { ScanTitle } from '../domain/scan-title';
import { FixedClock } from '../gateways/in-memory/fixed-clock.gateway';
import { InMemoryChapterWatchRepository } from '../gateways/in-memory/in-memory-chapter-watch-repository.gateway';
import { InMemoryCoverRepository } from '../gateways/in-memory/in-memory-cover-repository.gateway';
import { InMemoryCrashReporter } from '../gateways/in-memory/in-memory-crash-reporter.gateway';
import { InMemoryReportSettingsRepository } from '../gateways/in-memory/in-memory-report-settings-repository.gateway';
import { InMemoryScanRepository } from '../gateways/in-memory/in-memory-scan-repository.gateway';
import { InMemorySeriesSuggestionsRepository } from '../gateways/in-memory/in-memory-series-suggestions-repository.gateway';
import { InMemoryTelemetryRecorder } from '../gateways/in-memory/in-memory-telemetry-recorder.gateway';
import { RecordVisitedPageUseCase } from './record-visited-page.use-case';
import { RenameScanUseCase } from './rename-scan.use-case';
import { aScan } from './scans.fixture';

describe('RenameScanUseCase', () => {
  it('should show the scan under its new title with its reading, favorite and rating', async () => {
    const { rename, scans } = setUp([
      aScan({
        title: 'Lookism ( Makine)',
        chapter: 12,
        isFavorite: true,
        rating: 8,
      }),
    ]);

    const library = await rename('Lookism ( Makine)', 'Lookism');

    expect(library).toEqual([
      aScan({
        title: 'Lookism',
        chapter: 12,
        isFavorite: true,
        rating: 8,
        aliases: ['Lookism ( Makine)'],
      }),
    ]);
    expect(await scans()).toEqual(library);
  });

  it('should record a later reading under the parsed title on the renamed scan', async () => {
    const { rename, read, scans } = setUp([
      aScan({ title: 'Lookism ( Makine)', chapter: 12 }),
    ]);
    await rename('Lookism ( Makine)', 'Lookism');

    await read('Lookism ( Makine)', '13');

    expect(await scans()).toMatchObject([{ title: 'Lookism', chapter: 13 }]);
  });

  it('should record a later reading under the chosen title on the renamed scan', async () => {
    const { rename, read, scans } = setUp([
      aScan({ title: 'Punch', chapter: 200 }),
    ]);
    await rename('Punch', 'One Punch-Man');

    await read('One Punch Man', '201');

    expect(await scans()).toMatchObject([
      { title: 'One Punch-Man', chapter: 201 },
    ]);
  });

  it('should keep every title the scan was known under when it is renamed twice', async () => {
    const { rename, read, scans } = setUp([
      aScan({ title: 'Classmate - Capítulo', chapter: 3 }),
    ]);
    await rename('Classmate - Capítulo', 'Classmate');
    await rename('Classmate', 'My Classmate');

    await read('Classmate - Capítulo', '4');
    await read('Classmate', '5');

    expect(await scans()).toEqual([
      aScan({
        title: 'My Classmate',
        chapter: 5,
        url: catalogUrl('5'),
        readAt: NOW,
        aliases: ['Classmate - Capítulo', 'Classmate'],
      }),
    ]);
  });

  it('should drop the alias the scan is renamed back to', async () => {
    const { rename, scans } = setUp([aScan({ title: 'Punch' })]);
    await rename('Punch', 'One Punch-Man');

    await rename('One Punch-Man', 'Punch');

    expect(await scans()).toEqual([
      aScan({ title: 'Punch', aliases: ['One Punch-Man'] }),
    ]);
  });

  it('should only change the shown title when the new title differs by case', async () => {
    const { rename, scans, coverRepository } = setUp(
      [aScan({ title: 'solo leveling' })],
      { 'solo leveling': MISSING },
    );

    await rename('solo leveling', 'Solo Leveling');

    expect(await scans()).toEqual([aScan({ title: 'Solo Leveling' })]);
    expect(await coverRepository.find([ScanTitle.of('Solo Leveling')])).toEqual(
      new Map([['Solo Leveling', MISSING]]),
    );
  });

  it('should move the cover and the chapter watch of the scan to its new title', async () => {
    const { rename, coverRepository, watchRepository } = setUp(
      [aScan({ title: 'Punch' })],
      { Punch: MISSING },
      { Punch: UP_TO_DATE },
    );

    await rename('Punch', 'One Punch-Man');

    const titles = [ScanTitle.of('Punch'), ScanTitle.of('One Punch-Man')];
    expect(await coverRepository.find(titles)).toEqual(
      new Map([['One Punch-Man', MISSING]]),
    );
    expect(await watchRepository.find(titles)).toEqual(
      new Map([['One Punch-Man', UP_TO_DATE]]),
    );
  });

  it.each([
    ['the same title', 'Nano Machine', 'Nano Machine'],
    ['a title of the same series', 'Nanomachine', 'Nano Machine'],
    ['an alias of another scan', 'Lookism ( Makine)', 'Lookism'],
  ])(
    'should fail with SeriesAlreadyTracked and change nothing when another scan has %s',
    async (_, newTitle, trackedTitle) => {
      const followed = [
        aScan({ title: 'Punch' }),
        aScan({ title: 'Nano Machine' }),
        aScan({ title: 'Lookism', aliases: ['Lookism ( Makine)'] }),
      ];
      const { rename, scans } = setUp(followed);

      const renaming = rename('Punch', newTitle);

      await expect(renaming).rejects.toThrow(SeriesAlreadyTracked);
      await expect(renaming).rejects.toMatchObject({
        trackedTitle: ScanTitle.of(trackedTitle),
      });
      expect(await scans()).toEqual(followed);
    },
  );

  it('should fail with ScanNotFound when no scan has the title', async () => {
    const { rename } = setUp([aScan({ title: 'Punch' })]);

    await expect(rename('Lookism', 'Lookism 2')).rejects.toThrow(ScanNotFound);
  });
});

const NOW = new Date('2025-03-10T12:00:00Z');

const catalogUrl = (chapter: string): string =>
  `https://www.webtoons.com/en/fantasy/title/episode-${chapter}/viewer?title_no=1&episode_no=${chapter}`;

const MISSING: Cover = {
  kind: 'missing',
  triedAt: new Date('2025-03-10T12:00:00Z'),
};

const UP_TO_DATE: ChapterWatch = {
  kind: 'up-to-date',
  site: 'webtoons.com',
  latest: 12,
  checkedAt: new Date('2025-03-10T10:00:00Z'),
};

const setUp = (
  followed: ScanSnapshot[],
  covers: Readonly<Record<string, Cover>> = {},
  watches: Readonly<Record<string, ChapterWatch>> = {},
) => {
  const scanRepository = new InMemoryScanRepository(followed);
  const coverRepository = new InMemoryCoverRepository(covers);
  const watchRepository = new InMemoryChapterWatchRepository(watches);
  const renameScan = new RenameScanUseCase(
    scanRepository,
    coverRepository,
    watchRepository,
  );
  const recordVisitedPage = new RecordVisitedPageUseCase(
    scanRepository,
    new InMemorySeriesSuggestionsRepository(),
    new InMemoryCrashReporter(),
    new InMemoryReportSettingsRepository(),
    new FixedClock(NOW),
    new InMemoryTelemetryRecorder(),
  );
  return {
    coverRepository,
    watchRepository,
    scans: async () => (await scanRepository.load()).snapshot(),
    rename: (title: string, newTitle: string) =>
      renameScan.execute(ScanTitle.of(title), ScanTitle.of(newTitle)),
    read: (title: string, chapter: string) =>
      recordVisitedPage.execute({
        pageTitle: `Episode ${chapter} | ${title}`,
        url: catalogUrl(chapter),
      }),
  };
};
