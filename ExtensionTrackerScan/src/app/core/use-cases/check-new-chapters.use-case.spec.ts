import { ChapterWatch, HostProfile } from '../domain/chapter-watch';
import { FetchedPage } from '../domain/fetched-page';
import { ScanSnapshot } from '../domain/scan-library';
import { ScanTitle } from '../domain/scan-title';
import { FixedClock } from '../gateways/in-memory/fixed-clock.gateway';
import { InMemoryChapterWatchRepository } from '../gateways/in-memory/in-memory-chapter-watch-repository.gateway';
import { InMemoryHostProfileRepository } from '../gateways/in-memory/in-memory-host-profile-repository.gateway';
import { InMemoryNewChapterAlerts } from '../gateways/in-memory/in-memory-new-chapter-alerts.gateway';
import { InMemoryScanRepository } from '../gateways/in-memory/in-memory-scan-repository.gateway';
import { InMemoryWatchSettingsRepository } from '../gateways/in-memory/in-memory-watch-settings-repository.gateway';
import { InMemoryWebPages } from '../gateways/in-memory/in-memory-web-pages.gateway';
import { CheckNewChaptersUseCase } from './check-new-chapters.use-case';
import { aScan } from './scans.fixture';

describe('CheckNewChaptersUseCase', () => {
  it('should flag the latest chapter listed on the series page when it is after the last chapter read', async () => {
    const { checkNewChapters, alerts, watchOf } = setUp({
      scans: [aFavorite('Solo Leveling', 100)],
      pages: { [SERIES]: seriesPage([98, 99, 100, 101, 102]) },
    });

    await checkNewChapters();

    expect(await watchOf('Solo Leveling')).toEqual({
      kind: 'new',
      site: SITE,
      latest: 102,
      url: chapterUrl(102),
      foundAt: NOW,
      checkedAt: NOW,
    });
    expect(alerts.announcements).toEqual([
      [{ title: 'Solo Leveling', chapter: 102, url: chapterUrl(102) }],
    ]);
    expect(alerts.counts).toEqual([1]);
  });

  it('should keep a favorite up to date when its series page lists no chapter after the last read', async () => {
    const { checkNewChapters, alerts, watchOf } = setUp({
      scans: [aFavorite('Solo Leveling', 102)],
      pages: { [SERIES]: seriesPage([100, 101, 102]) },
    });

    await checkNewChapters();

    expect(await watchOf('Solo Leveling')).toEqual({
      kind: 'up-to-date',
      site: SITE,
      latest: 102,
      checkedAt: NOW,
    });
    expect(alerts.announcements).toEqual([]);
    expect(alerts.counts).toEqual([0]);
  });

  it('should flag a later decimal chapter after a decimal chapter read', async () => {
    const { checkNewChapters, watchOf } = setUp({
      scans: [aFavorite('Solo Leveling', 16.2)],
      pages: { [SERIES]: seriesPage([15, 16, 16.2, 16.5]) },
    });

    await checkNewChapters();

    expect(await watchOf('Solo Leveling')).toMatchObject({
      kind: 'new',
      latest: 16.5,
    });
  });

  it('should not check a scan that is not a favorite', async () => {
    const { checkNewChapters, web, watchOf } = setUp({
      scans: [aScan({ ...aFavorite('Solo Leveling', 100), isFavorite: false })],
      pages: { [SERIES]: seriesPage([100, 101, 102]) },
    });

    await checkNewChapters();

    expect(web.fetchedUrls).toEqual([]);
    expect(await watchOf('Solo Leveling')).toBeUndefined();
  });

  it('should read the last page of a chapter list that is paginated', async () => {
    const { checkNewChapters, web, watchOf } = setUp({
      scans: [aFavorite('Solo Leveling', 100)],
      pages: {
        [SERIES]: seriesPage([1, 2, 3], `<a href="${SERIES}?page=5">5</a>`),
        [`${SERIES}?page=5`]: seriesPage([99, 100, 101]),
      },
    });

    await checkNewChapters();

    expect(web.fetchedUrls).toEqual([FEED, SERIES, `${SERIES}?page=5`]);
    expect(await watchOf('Solo Leveling')).toMatchObject({
      kind: 'new',
      latest: 101,
    });
  });

  it('should not trust a chapter list that gives the same number to two chapters', async () => {
    const { checkNewChapters, alerts } = setUp({
      scans: [aFavorite('Solo Leveling', 3)],
      pages: {
        [SERIES]: page(
          [1, 2, 3, 1, 2, 3, 4, 5]
            .map(
              (chapter, index) =>
                `<a href="${SERIES}/volume-${index < 3 ? 2 : 1}/chapter-${chapter}">Chapter ${chapter}</a>`,
            )
            .join(''),
        ),
      },
    });

    await checkNewChapters();

    expect(alerts.announcements).toEqual([]);
  });

  it('should not count the chapters of another series whose address starts like the series', async () => {
    const { checkNewChapters, alerts, watchOf } = setUp({
      scans: [aFavorite('Solo Leveling', 200, SLUG_SERIES)],
      pages: {
        [SLUG_SERIES]: page(
          [198, 199, 200]
            .map(
              (chapter) =>
                `<a href="https://themesia.org/solo-leveling-chapter-${chapter}/">Chapter ${chapter}</a>`,
            )
            .join('') +
            '<a href="https://themesia.org/solo-leveling-ragnarok-chapter-240/">Chapter 240</a>',
        ),
      },
    });

    await checkNewChapters();

    expect(await watchOf('Solo Leveling')).toMatchObject({
      kind: 'up-to-date',
      latest: 200,
    });
    expect(alerts.announcements).toEqual([]);
  });

  it('should read the WEBTOON feed of the series and ignore the episodes of another series', async () => {
    const { checkNewChapters, web, watchOf } = setUp({
      scans: [
        aScan({
          title: 'Omniscient Reader',
          chapter: 307,
          url: 'https://www.webtoons.com/en/action/omniscient-reader/episode-307/viewer?title_no=2154&episode_no=308',
          isFavorite: true,
        }),
      ],
      pages: {
        'https://www.webtoons.com/en/action/omniscient-reader/rss?title_no=2154':
          feed([
            ['Episode 308', 'title_no=2154&amp;episode_no=309'],
            ['Episode 307', 'title_no=2154&amp;episode_no=308'],
            ['Episode 999', 'title_no=21540&amp;episode_no=999'],
          ]),
      },
    });

    await checkNewChapters();

    expect(web.fetchedUrls).toEqual([
      'https://www.webtoons.com/en/action/omniscient-reader/rss?title_no=2154',
    ]);
    expect(await watchOf('Omniscient Reader')).toMatchObject({
      kind: 'new',
      latest: 308,
      url: 'https://www.webtoons.com/en/action/omniscient-reader/episode/viewer?title_no=2154&episode_no=309',
    });
  });

  it('should read the category feed of a WordPress series before its series page, without its tracking parameters', async () => {
    const { checkNewChapters, web, watchOf } = setUp({
      scans: [aFavorite('Solo Leveling', 200, SLUG_SERIES)],
      pages: {
        'https://themesia.org/category/solo-leveling/feed/': page(
          '<rss><item><title>Solo Leveling Chapter 201</title><link>https://themesia.org/solo-leveling-chapter-201/?utm_source=rss&amp;utm_medium=rss</link></item></rss>',
        ),
      },
    });

    await checkNewChapters();

    expect(web.fetchedUrls).toEqual([
      'https://themesia.org/category/solo-leveling/feed/',
    ]);
    expect(await watchOf('Solo Leveling')).toMatchObject({
      kind: 'new',
      latest: 201,
      url: 'https://themesia.org/solo-leveling-chapter-201/',
    });
  });

  it('should probe the next chapter address once the site refused a far chapter', async () => {
    const { checkNewChapters, web, watchOf, hostOf } = setUp({
      scans: [aFavorite('Solo Leveling', 100, null)],
      pages: {
        [chapterUrl(101)]: chapterPage(101),
        [chapterUrl(4100)]: page('<title>Page not found</title>', 404),
      },
    });

    await checkNewChapters();

    expect(web.fetchedUrls).toEqual([chapterUrl(101), chapterUrl(4100)]);
    expect(await watchOf('Solo Leveling')).toMatchObject({
      kind: 'new',
      latest: 101,
      url: chapterUrl(101),
    });
    expect((await hostOf(SITE))?.lessons['far-chapter']?.value).toBe('refused');
  });

  it('should not believe a site that shows any chapter number asked for', async () => {
    const { checkNewChapters, alerts, watchOf } = setUp({
      scans: [aFavorite('Solo Leveling', 100, null)],
      pages: {
        [chapterUrl(101)]: chapterPage(101),
        [chapterUrl(4100)]: chapterPage(4100),
      },
    });

    await checkNewChapters();

    expect(await watchOf('Solo Leveling')).toMatchObject({
      kind: 'unsupported',
      reason: 'echoes-any-chapter',
    });
    expect(alerts.announcements).toEqual([]);
  });

  it('should mark a site that fills its chapter pages by script as impossible to check', async () => {
    const { checkNewChapters, watchOf } = setUp({
      scans: [aFavorite('Solo Leveling', 100, null)],
      pages: {
        [chapterUrl(101)]: page('<title>Reader</title>'),
        [chapterUrl(100)]: page('<title>Reader</title>'),
      },
    });

    await checkNewChapters();

    expect(await watchOf('Solo Leveling')).toMatchObject({
      kind: 'unsupported',
      reason: 'script-only',
    });
  });

  it('should use what it learned of a site without asking it again', async () => {
    const { checkNewChapters, web } = setUp({
      scans: [
        aFavorite('Solo Leveling', 100, null),
        aFavorite('Omniscient Reader', 50, null, 'omniscient-reader'),
      ],
      pages: {
        [chapterUrl(101)]: chapterPage(101),
        [chapterUrl(4100)]: page('', 404),
        [chapterUrl(51, 'omniscient-reader')]: chapterPage(51),
      },
    });

    await checkNewChapters();

    expect(web.fetchedUrls).toEqual([
      chapterUrl(101),
      chapterUrl(4100),
      chapterUrl(51, 'omniscient-reader'),
    ]);
  });

  it('should wait between two requests to the same site but not between two sites', async () => {
    const { checkNewChapters, web } = setUp({
      scans: [
        aFavorite('Solo Leveling', 100),
        aFavorite('Omniscient Reader', 50, OTHER_SERIES),
      ],
      pages: {
        [SERIES]: seriesPage([99, 100, 101]),
        [OTHER_SERIES]: page(
          [49, 50, 51]
            .map(
              (chapter) =>
                `<a href="${OTHER_SERIES}/chapter-${chapter}">Chapter ${chapter}</a>`,
            )
            .join(''),
        ),
      },
    });

    await checkNewChapters();

    expect(web.fetchedUrls).toEqual(
      expect.arrayContaining([FEED, SERIES, OTHER_FEED, OTHER_SERIES]),
    );
    expect(web.events.filter(({ kind }) => kind === 'wait')).toEqual([
      { kind: 'wait', spacing: SPACING },
      { kind: 'wait', spacing: SPACING },
    ]);
  });

  it('should stop checking a site that refuses, and leave it alone for an hour', async () => {
    const { checkNewChapters, web, hostOf, runAt } = setUp({
      scans: [
        aFavorite('Solo Leveling', 100),
        aFavorite('Omniscient Reader', 50, `${SERIES_HOST}/series/orv`),
      ],
      pages: { [SERIES]: page('<title>Just a moment...</title>', 429) },
    });

    await checkNewChapters();
    await runAt(new Date(NOW.getTime() + 59 * MINUTE));

    expect(web.fetchedUrls).toEqual([FEED, SERIES]);
    expect((await hostOf(SITE))?.backoff).toEqual({
      strikes: 1,
      until: new Date(NOW.getTime() + 60 * MINUTE),
    });
  });

  it('should check at most 50 favorites in one run, the longest unchecked first', async () => {
    const scans = Array.from({ length: 52 }, (_, index) =>
      aFavorite(`Series ${index}`, 1, `https://site-${index}.org/series/s`),
    );
    const { checkNewChapters, web } = setUp({
      scans,
      watches: {
        'Series 0': upToDate('site-0.org', NOW.getTime() - 7 * HOUR),
        'Series 1': upToDate('site-1.org', NOW.getTime() - 8 * HOUR),
      },
    });

    await checkNewChapters();

    const checkedSites = new Set(
      web.fetchedUrls.map((url) => new URL(url).host),
    );
    expect(checkedSites.size).toBe(50);
    expect(checkedSites).not.toContain('site-0.org');
    expect(checkedSites).not.toContain('site-1.org');
  });

  it('should not check again a favorite checked within the chosen interval', async () => {
    const { checkNewChapters, web, runAt } = setUp({
      scans: [aFavorite('Solo Leveling', 100)],
      pages: { [SERIES]: seriesPage([99, 100, 101]) },
    });

    await checkNewChapters();
    await runAt(new Date(NOW.getTime() + 5 * HOUR));
    await runAt(new Date(NOW.getTime() + 6 * HOUR));

    expect(web.fetchedUrls).toEqual([FEED, SERIES, SERIES]);
  });

  it('should check every hour when the reader chose one hour', async () => {
    const { web, runAt } = setUp({
      scans: [aFavorite('Solo Leveling', 100)],
      pages: { [SERIES]: seriesPage([99, 100, 101]) },
      settings: { checkEvery: '1h' },
    });

    await runAt(NOW);
    await runAt(new Date(NOW.getTime() + HOUR));

    expect(web.fetchedUrls).toEqual([FEED, SERIES, SERIES]);
  });

  it('should announce a chapter once, and a later chapter again', async () => {
    const { alerts, runAt, web } = setUp({
      scans: [aFavorite('Solo Leveling', 100)],
      pages: { [SERIES]: seriesPage([99, 100, 101]) },
    });

    await runAt(NOW);
    await runAt(new Date(NOW.getTime() + 6 * HOUR));
    web.serve({ [SERIES]: seriesPage([100, 101, 102]) });
    await runAt(new Date(NOW.getTime() + 12 * HOUR));

    expect(alerts.announcements).toEqual([
      [{ title: 'Solo Leveling', chapter: 101, url: chapterUrl(101) }],
      [{ title: 'Solo Leveling', chapter: 102, url: chapterUrl(102) }],
    ]);
  });

  it('should group the new chapters of one run in one announcement', async () => {
    const { checkNewChapters, alerts } = setUp({
      scans: [
        aFavorite('Solo Leveling', 100),
        aFavorite('Omniscient Reader', 50, OTHER_SERIES),
      ],
      pages: {
        [SERIES]: seriesPage([99, 100, 101]),
        [OTHER_SERIES]: page(
          [50, 51, 52]
            .map(
              (chapter) =>
                `<a href="${OTHER_SERIES}/chapter-${chapter}">Chapter ${chapter}</a>`,
            )
            .join(''),
        ),
      },
    });

    await checkNewChapters();

    expect(alerts.announcements).toHaveLength(1);
    expect(alerts.announcements[0]).toHaveLength(2);
    expect(alerts.counts).toEqual([2]);
  });

  it('should retry an unreachable favorite after 15 minutes and keep its last known chapter', async () => {
    const lastKnown: ChapterWatch = {
      kind: 'new',
      site: SITE,
      latest: 101,
      url: chapterUrl(101),
      foundAt: new Date(NOW.getTime() - 7 * HOUR),
      checkedAt: new Date(NOW.getTime() - 7 * HOUR),
    };
    const { checkNewChapters, watchOf, alerts } = setUp({
      scans: [aFavorite('Solo Leveling', 100)],
      watches: { 'Solo Leveling': lastKnown },
      pages: { [SERIES]: { kind: 'unreachable' } },
    });

    await checkNewChapters();

    expect(await watchOf('Solo Leveling')).toEqual({
      kind: 'failing',
      site: SITE,
      since: NOW,
      attempts: 1,
      nextAttemptAt: new Date(NOW.getTime() + 15 * MINUTE),
      lastKnown,
    });
    expect(alerts.counts).toEqual([1]);
  });

  it('should ignore what it knew of the series on another site', async () => {
    const { checkNewChapters, web } = setUp({
      scans: [aFavorite('Solo Leveling', 100)],
      watches: {
        'Solo Leveling': upToDate('other-site.org', NOW.getTime() - HOUR),
      },
      pages: { [SERIES]: seriesPage([99, 100, 101]) },
    });

    await checkNewChapters();

    expect(web.fetchedUrls).toEqual([FEED, SERIES]);
  });
});

const NOW = new Date('2026-10-23T12:00:00Z');
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const SITE = 'scans.org';
const SERIES_HOST = `https://${SITE}`;
const SERIES = `${SERIES_HOST}/series/solo-leveling`;
const FEED = `${SERIES_HOST}/category/solo-leveling/feed/`;
const OTHER_SERIES = 'https://other-scans.org/series/omniscient-reader';
const OTHER_FEED = 'https://other-scans.org/category/omniscient-reader/feed/';
const SPACING = { atLeastMs: 3000, jitterMs: 2000 };
const SLUG_SERIES = 'https://themesia.org/manga/solo-leveling/';

const chapterUrl = (chapter: number, slug = 'solo-leveling'): string =>
  `${SERIES_HOST}/series/${slug}/chapter-${chapter}`;

const aFavorite = (
  title: string,
  chapter: number,
  seriesUrl: string | null = SERIES,
  slug = 'solo-leveling',
): ScanSnapshot =>
  aScan({
    title,
    chapter,
    url:
      seriesUrl === null || seriesUrl.startsWith(SERIES_HOST)
        ? chapterUrl(chapter, slug)
        : `${seriesUrl.replace(/\/$/, '')}/chapter-${chapter}`,
    seriesUrl: seriesUrl ?? undefined,
    isFavorite: true,
  });

const page = (text: string, status = 200): FetchedPage => ({
  kind: 'page',
  status,
  url: '',
  text,
});

const seriesPage = (chapters: readonly number[], extra = ''): FetchedPage =>
  page(
    chapters
      .map(
        (chapter) => `<a href="${chapterUrl(chapter)}">Chapter ${chapter}</a>`,
      )
      .join('') + extra,
  );

const chapterPage = (chapter: number): FetchedPage =>
  page(`<title>Solo Leveling Chapter ${chapter} - Scans</title>`);

const feed = (items: readonly (readonly [string, string])[]): FetchedPage =>
  page(
    `<rss>${items
      .map(
        ([title, query]) =>
          `<item><title><![CDATA[${title}]]></title><link>https://www.webtoons.com/en/action/omniscient-reader/episode/viewer?${query}</link></item>`,
      )
      .join('')}</rss>`,
  );

const upToDate = (site: string, checkedAt: number): ChapterWatch => ({
  kind: 'up-to-date',
  site,
  latest: 1,
  checkedAt: new Date(checkedAt),
});

const setUp = ({
  scans,
  pages = {},
  watches = {},
  hosts = {},
  settings = { checkEvery: '6h' },
}: {
  scans: ScanSnapshot[];
  pages?: Readonly<Record<string, FetchedPage>>;
  watches?: Readonly<Record<string, ChapterWatch>>;
  hosts?: Readonly<Record<string, HostProfile>>;
  settings?: { checkEvery: '1h' | '6h' | '24h' };
}) => {
  const scanRepository = new InMemoryScanRepository(scans);
  const watchRepository = new InMemoryChapterWatchRepository(watches);
  const hostRepository = new InMemoryHostProfileRepository(hosts);
  const settingsRepository = new InMemoryWatchSettingsRepository(settings);
  const web = new InMemoryWebPages(pages);
  const alerts = new InMemoryNewChapterAlerts();
  const runAt = (date: Date): Promise<void> =>
    new CheckNewChaptersUseCase(
      scanRepository,
      watchRepository,
      hostRepository,
      settingsRepository,
      web,
      web,
      alerts,
      new FixedClock(date),
    ).execute();
  return {
    checkNewChapters: () => runAt(NOW),
    runAt,
    web,
    alerts,
    watchOf: async (title: string) =>
      (await watchRepository.find([ScanTitle.of(title)])).get(title),
    hostOf: async (site: string) =>
      (await hostRepository.find([site])).get(site),
  };
};
