import { ChapterWatch } from '../domain/chapter-watch';
import { Cover, Thumbnail } from '../domain/cover';
import {
  MergeIntoItself,
  ScanNotFound,
  ScanSnapshot,
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
import { MergeScansUseCase } from './merge-scans.use-case';
import { RecordVisitedPageUseCase } from './record-visited-page.use-case';
import { aScan } from './scans.fixture';

describe('MergeScansUseCase', () => {
  it('should keep the target title with the latest reading of the two scans', async () => {
    const eleceed = aScan({ title: 'Eleceed' });
    const { merge, scans } = setUp([
      aScan({
        title: 'Classmate',
        chapter: 3,
        url: 'old.com',
        readAt: EARLIER,
      }),
      eleceed,
      aScan({
        title: 'Classmate - Capítulo',
        chapter: 5,
        url: 'new.com',
        readAt: LATER,
        origin: 'other-device',
        seriesUrl: 'https://new.com/classmate',
      }),
    ]);

    const { library } = await merge('Classmate - Capítulo', 'Classmate');

    expect(library).toEqual([
      aScan({
        title: 'Classmate',
        chapter: 5,
        url: 'new.com',
        readAt: LATER,
        origin: 'other-device',
        seriesUrl: 'https://new.com/classmate',
        aliases: ['Classmate - Capítulo'],
      }),
      eleceed,
    ]);
    expect(await scans()).toEqual(library);
  });

  it('should keep the reading of the target when it is the latest', async () => {
    const { merge } = setUp([
      aScan({ title: 'Punch', chapter: 150, readAt: EARLIER }),
      aScan({ title: 'One Punch-Man', chapter: 200, readAt: LATER }),
    ]);

    const { library } = await merge('Punch', 'One Punch-Man');

    expect(library).toEqual([
      aScan({
        title: 'One Punch-Man',
        chapter: 200,
        readAt: LATER,
        aliases: ['Punch'],
      }),
    ]);
  });

  it.each([
    ['only the source is followed', false, true, true],
    ['only the target is followed', true, false, true],
    ['neither is followed', false, false, false],
  ])(
    'should follow the merged scan when %s',
    async (_, isTargetFavorite, isSourceFavorite, isFavorite) => {
      const { merge } = setUp([
        aScan({ title: 'Punch', isFavorite: isSourceFavorite }),
        aScan({ title: 'One Punch-Man', isFavorite: isTargetFavorite }),
      ]);

      const { library } = await merge('Punch', 'One Punch-Man');

      expect(library).toMatchObject([{ isFavorite }]);
    },
  );

  it.each([
    ['both are rated', 6, 9, 6],
    ['only the source is rated', undefined, 9, 9],
    ['only the target is rated', 6, undefined, 6],
  ])(
    'should keep the rating of the target, else of the source, when %s',
    async (_, targetRating, sourceRating, rating) => {
      const { merge } = setUp([
        aScan({ title: 'Punch', rating: sourceRating, readAt: LATER }),
        aScan({ title: 'One Punch-Man', rating: targetRating }),
      ]);

      const { library } = await merge('Punch', 'One Punch-Man');

      expect(library).toMatchObject([{ rating }]);
    },
  );

  it('should record a later reading under any title of the source on the merged scan', async () => {
    const { merge, read, scans } = setUp([
      aScan({ title: 'Lookism', chapter: 10, readAt: EARLIER }),
      aScan({
        title: 'Lookism ( Makine)',
        chapter: 11,
        readAt: EARLIER,
        aliases: ['Lookism - Capítulo'],
      }),
    ]);
    await merge('Lookism ( Makine)', 'Lookism');

    await read('Lookism ( Makine)', '12');
    await read('Lookism - Capítulo', '13');

    expect(await scans()).toEqual([
      aScan({
        title: 'Lookism',
        chapter: 13,
        url: catalogUrl('13'),
        readAt: NOW,
        aliases: ['Lookism ( Makine)', 'Lookism - Capítulo'],
      }),
    ]);
  });

  it('should keep the cover and the watch of the latest reading under the target title', async () => {
    const { merge, coverRepository, watchRepository } = setUp(
      [
        aScan({ title: 'Punch', readAt: LATER }),
        aScan({ title: 'One Punch-Man', readAt: EARLIER }),
      ],
      { Punch: FOUND, 'One Punch-Man': OTHER_FOUND },
      { Punch: NEW_CHAPTER, 'One Punch-Man': UP_TO_DATE },
    );

    await merge('Punch', 'One Punch-Man');

    expect(await coverRepository.find(BOTH_TITLES)).toEqual(
      new Map([['One Punch-Man', FOUND]]),
    );
    expect(await watchRepository.find(BOTH_TITLES)).toEqual(
      new Map([['One Punch-Man', NEW_CHAPTER]]),
    );
  });

  it('should keep the image of the earlier reading when the latest reading has none', async () => {
    const { merge, coverRepository, watchRepository } = setUp(
      [
        aScan({ title: 'Punch', readAt: EARLIER }),
        aScan({ title: 'One Punch-Man', readAt: LATER }),
      ],
      { Punch: FOUND, 'One Punch-Man': MISSING },
      { Punch: UP_TO_DATE },
    );

    await merge('Punch', 'One Punch-Man');

    expect(await coverRepository.find(BOTH_TITLES)).toEqual(
      new Map([['One Punch-Man', FOUND]]),
    );
    expect(await watchRepository.find(BOTH_TITLES)).toEqual(
      new Map([['One Punch-Man', UP_TO_DATE]]),
    );
  });

  it('should hand back both scans as they were, with their cover and watch, so the merge can be undone', async () => {
    const source = aScan({ title: 'Punch', readAt: LATER, isFavorite: true });
    const target = aScan({ title: 'One Punch-Man', rating: 7 });
    const { merge } = setUp(
      [source, target],
      { Punch: FOUND },
      {
        'One Punch-Man': UP_TO_DATE,
      },
    );

    const { merged } = await merge('punch', 'One Punch-Man');

    expect(merged).toEqual({
      source: { scan: source, cover: FOUND },
      target: { scan: target, watch: UP_TO_DATE },
    });
  });

  it('should fail with MergeIntoItself and change nothing when the source is the target', async () => {
    const followed = [aScan({ title: 'Punch' })];
    const { merge, scans } = setUp(followed);

    await expect(merge('Punch', 'punch')).rejects.toThrow(MergeIntoItself);
    expect(await scans()).toEqual(followed);
  });

  it('should fail with ScanNotFound and change nothing when the target is gone', async () => {
    const followed = [aScan({ title: 'Punch' })];
    const { merge, scans } = setUp(followed);

    await expect(merge('Punch', 'One Punch-Man')).rejects.toThrow(ScanNotFound);
    expect(await scans()).toEqual(followed);
  });
});

const NOW = new Date('2025-03-10T12:00:00Z');
const EARLIER = new Date('2025-03-01T12:00:00Z');
const LATER = new Date('2025-03-05T12:00:00Z');
const BOTH_TITLES = [ScanTitle.of('Punch'), ScanTitle.of('One Punch-Man')];

const catalogUrl = (chapter: string): string =>
  `https://www.webtoons.com/en/fantasy/title/episode-${chapter}/viewer?title_no=1&episode_no=${chapter}`;

const thumbnail = (dataUrl: string): Thumbnail => {
  const parsed = Thumbnail.parse(dataUrl);
  if (!parsed) {
    throw new Error('The thumbnail does not parse');
  }
  return parsed;
};

const FOUND: Cover = {
  kind: 'found',
  thumbnail: thumbnail('data:image/webp;base64,UklGRg=='),
  from: 'page',
  at: EARLIER,
};

const OTHER_FOUND: Cover = {
  kind: 'found',
  thumbnail: thumbnail('data:image/webp;base64,T1RIRVI='),
  from: 'series-page',
  at: EARLIER,
};

const MISSING: Cover = { kind: 'missing', triedAt: EARLIER };

const UP_TO_DATE: ChapterWatch = {
  kind: 'up-to-date',
  site: 'webtoons.com',
  latest: 12,
  checkedAt: EARLIER,
};

const NEW_CHAPTER: ChapterWatch = {
  kind: 'new',
  site: 'webtoons.com',
  latest: 13,
  url: catalogUrl('13'),
  foundAt: LATER,
  checkedAt: LATER,
};

const setUp = (
  followed: ScanSnapshot[],
  covers: Readonly<Record<string, Cover>> = {},
  watches: Readonly<Record<string, ChapterWatch>> = {},
) => {
  const scanRepository = new InMemoryScanRepository(followed);
  const coverRepository = new InMemoryCoverRepository(covers);
  const watchRepository = new InMemoryChapterWatchRepository(watches);
  const mergeScans = new MergeScansUseCase(
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
    merge: (source: string, target: string) =>
      mergeScans.execute(ScanTitle.of(source), ScanTitle.of(target)),
    read: (title: string, chapter: string) =>
      recordVisitedPage.execute({
        pageTitle: `Episode ${chapter} | ${title}`,
        url: catalogUrl(chapter),
      }),
  };
};
