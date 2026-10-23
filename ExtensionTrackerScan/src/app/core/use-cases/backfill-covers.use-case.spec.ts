import { Cover, Thumbnail } from '../domain/cover';
import { PageSignals } from '../domain/parsed-page';
import { ScanSnapshot } from '../domain/scan-library';
import { ScanTitle } from '../domain/scan-title';
import { FixedClock } from '../gateways/in-memory/fixed-clock.gateway';
import { InMemoryCoverRepository } from '../gateways/in-memory/in-memory-cover-repository.gateway';
import { InMemoryScanRepository } from '../gateways/in-memory/in-memory-scan-repository.gateway';
import { InMemoryTelemetryRecorder } from '../gateways/in-memory/in-memory-telemetry-recorder.gateway';
import {
  ImageSize,
  InMemoryWeb,
  thumbnailOf,
} from '../gateways/in-memory/in-memory-web.gateway';
import { BackfillCoversUseCase } from './backfill-covers.use-case';
import { COVER_PAGES } from './cover-pages.fixture';
import { aScan } from './scans.fixture';

describe('BackfillCoversUseCase', () => {
  it.each(COVER_PAGES)(
    'should store the cover a person picked on $host, or none, from the last chapter read',
    async ({ seriesTitle, page, seriesPage, images, expected }) => {
      const { backfillCovers, coverOf } = setUp({
        scans: [aScan({ title: seriesTitle, url: page.url })],
        pages: seriesPage ? [page, seriesPage] : [page],
        images,
      });

      await backfillCovers.execute([ScanTitle.of(seriesTitle)]);

      expect(await coverOf(seriesTitle)).toEqual(
        expected
          ? found(expected.imageUrl, expected.from)
          : { kind: 'missing', triedAt: NOW },
      );
    },
  );

  it('should start from the series page when the scan knows it', async () => {
    const { backfillCovers, coverOf, web, telemetry } = setUp({
      scans: [
        aScan({
          title: 'Solo Leveling',
          url: CHAPTER_URL,
          seriesUrl: SERIES_URL,
        }),
      ],
      pages: [seriesPage({ metaImages: [COVER_URL] })],
      images: { [COVER_URL]: PORTRAIT },
    });

    await backfillCovers.execute([ScanTitle.of('Solo Leveling')]);

    expect(web.requests.map(({ url }) => url)).toEqual([SERIES_URL, COVER_URL]);
    expect(await coverOf('Solo Leveling')).toEqual(
      found(COVER_URL, 'series-page'),
    );
    expect(telemetry.recordedEvents).toEqual([
      { kind: 'cover-search', outcome: 'found-series-page' },
    ]);
  });

  it('should follow the series link of the last chapter read when no image of the chapter is a cover', async () => {
    const { backfillCovers, coverOf, web } = setUp({
      scans: [aScan({ title: 'Solo Leveling', url: CHAPTER_URL })],
      pages: [
        chapterPage({
          metaImages: [BANNER_URL],
          links: [
            { href: SERIES_URL, text: 'Solo Leveling', isBreadcrumb: true },
          ],
        }),
        seriesPage({
          metaImages: [BANNER_URL],
          images: [{ src: COVER_URL, alt: 'Solo Leveling cover' }],
        }),
      ],
      images: {
        [BANNER_URL]: { width: 1200, height: 630 },
        [COVER_URL]: PORTRAIT,
      },
    });

    await backfillCovers.execute([ScanTitle.of('Solo Leveling')]);

    expect(web.requests.map(({ url }) => url)).toEqual([
      CHAPTER_URL,
      BANNER_URL,
      SERIES_URL,
      COVER_URL,
    ]);
    expect(await coverOf('Solo Leveling')).toEqual(
      found(COVER_URL, 'series-page'),
    );
  });

  it('should send the page where the image was found as Referer', async () => {
    const { backfillCovers, web } = setUp({
      scans: [aScan({ title: 'Solo Leveling', url: CHAPTER_URL })],
      pages: [chapterPage({ metaImages: [COVER_URL] })],
      images: { [COVER_URL]: PORTRAIT },
    });

    await backfillCovers.execute([ScanTitle.of('Solo Leveling')]);

    expect(web.requests).toContainEqual({
      url: COVER_URL,
      referer: CHAPTER_URL,
    });
  });

  it.each`
    pageUrl                                              | referer
    ${'https://mangadex.org/chapter/8160d350'}           | ${'https://mangadex.org/chapter/8160d350'}
    ${'https://comick.io/comic/solo-leveling/chapter-1'} | ${undefined}
  `(
    'should send $referer as Referer to MangaDex uploads when the image is found on $pageUrl',
    async ({ pageUrl, referer }) => {
      const imageUrl = 'https://uploads.mangadex.org/covers/1/cover.jpg';
      const { backfillCovers, web } = setUp({
        scans: [aScan({ title: 'Solo Leveling', url: pageUrl })],
        pages: [
          { pageTitle: 'Solo Leveling', url: pageUrl, metaImages: [imageUrl] },
        ],
        images: { [imageUrl]: PORTRAIT },
      });

      await backfillCovers.execute([ScanTitle.of('Solo Leveling')]);

      expect(web.requests[1]).toEqual({ url: imageUrl, referer });
    },
  );

  it.each`
    shape          | size
    ${'landscape'} | ${{ width: 1200, height: 630 }}
    ${'square'}    | ${{ width: 400, height: 400 }}
    ${'strip'}     | ${{ width: 800, height: 12000 }}
    ${'tiny'}      | ${{ width: 90, height: 120 }}
  `(
    'should record the cover as missing when the only image is $shape',
    async ({ size }) => {
      const { backfillCovers, coverOf } = setUp({
        scans: [aScan({ title: 'Solo Leveling', url: CHAPTER_URL })],
        pages: [chapterPage({ metaImages: [COVER_URL] })],
        images: { [COVER_URL]: size },
      });

      await backfillCovers.execute([ScanTitle.of('Solo Leveling')]);

      expect(await coverOf('Solo Leveling')).toEqual({
        kind: 'missing',
        triedAt: NOW,
      });
    },
  );

  it.each`
    width  | height
    ${100} | ${200}
    ${180} | ${200}
  `(
    'should accept a cover $width px wide and $height px high',
    async ({ width, height }) => {
      const { backfillCovers, coverOf } = setUp({
        scans: [aScan({ title: 'Solo Leveling', url: CHAPTER_URL })],
        pages: [chapterPage({ metaImages: [COVER_URL] })],
        images: { [COVER_URL]: { width, height } },
      });

      await backfillCovers.execute([ScanTitle.of('Solo Leveling')]);

      expect(await coverOf('Solo Leveling')).toEqual(found(COVER_URL, 'page'));
    },
  );

  it('should download an image once when the chapter and the series page show it', async () => {
    const { backfillCovers, web } = setUp({
      scans: [aScan({ title: 'Solo Leveling', url: CHAPTER_URL })],
      pages: [
        chapterPage({
          metaImages: [BANNER_URL],
          links: [
            { href: SERIES_URL, text: 'Solo Leveling', isBreadcrumb: false },
          ],
        }),
        seriesPage({ metaImages: [BANNER_URL] }),
      ],
      images: { [BANNER_URL]: { width: 1200, height: 630 } },
    });

    await backfillCovers.execute([ScanTitle.of('Solo Leveling')]);

    expect(web.requests.map(({ url }) => url)).toEqual([
      CHAPTER_URL,
      BANNER_URL,
      SERIES_URL,
    ]);
  });

  it.each<[string, () => Cover | undefined, boolean]>([
    ['was never searched', () => undefined, true],
    ['was missed 7 days ago', () => missed(7), true],
    ['was missed 6 days ago', () => missed(6), false],
    ['was found', () => found(COVER_URL, 'page'), false],
  ])(
    'should search the cover again when it %s: %s',
    async (_, coverBefore, isSearched) => {
      const cover = coverBefore();
      const { backfillCovers, web } = setUp({
        scans: [aScan({ title: 'Solo Leveling', url: CHAPTER_URL })],
        covers: cover ? { 'Solo Leveling': cover } : {},
        pages: [chapterPage({ metaImages: [COVER_URL] })],
        images: { [COVER_URL]: PORTRAIT },
      });

      await backfillCovers.execute([ScanTitle.of('Solo Leveling')]);

      expect(web.requests.length > 0).toBe(isSearched);
    },
  );

  it('should search at most 10 scans at once', async () => {
    const titles = Array.from({ length: 12 }, (_, index) => `Series ${index}`);
    const { backfillCovers, web } = setUp({
      scans: titles.map((title, index) =>
        aScan({
          title,
          url: `https://site-${index}.com/series/${index}/chapter-1`,
        }),
      ),
    });

    await backfillCovers.execute(titles.map(ScanTitle.of));

    expect(web.requests).toHaveLength(10);
  });

  it('should send one request at a time to a website', async () => {
    const titles = ['Solo Leveling', 'Nano Machine', 'The Breaker'];
    const { backfillCovers, web } = setUp({
      scans: titles.map((title, index) =>
        aScan({
          title,
          url: `https://asuracomic.net/series/${index}/chapter/1`,
        }),
      ),
    });

    await backfillCovers.execute(titles.map(ScanTitle.of));

    expect(web.requests).toHaveLength(3);
    expect(web.mostRequestsAtOnceOnOneSite).toBe(1);
  });

  it('should ignore a title that no scan of the library has', async () => {
    const { backfillCovers, web, coverOf } = setUp({});

    await backfillCovers.execute([ScanTitle.of('Solo Leveling')]);

    expect(web.requests).toEqual([]);
    expect(await coverOf('Solo Leveling')).toBeUndefined();
  });
});

const NOW = new Date('2025-03-10T12:00:00Z');
const CHAPTER_URL = 'https://asuracomic.net/series/solo-leveling/chapter/37';
const SERIES_URL = 'https://asuracomic.net/series/solo-leveling';
const COVER_URL = 'https://gg.asuracomic.net/covers/solo-leveling.webp';
const BANNER_URL = 'https://gg.asuracomic.net/banners/solo-leveling.webp';
const PORTRAIT: ImageSize = { width: 720, height: 1030 };

const missed = (daysAgo: number): Cover => ({
  kind: 'missing',
  triedAt: new Date(NOW.getTime() - daysAgo * 24 * 60 * 60 * 1000),
});

const thumbnail = (imageUrl: string): Thumbnail => {
  const shown = thumbnailOf(imageUrl);
  if (!shown) {
    throw new Error(`No thumbnail for ${imageUrl}`);
  }
  return shown;
};

const found = (imageUrl: string, from: 'page' | 'series-page'): Cover => ({
  kind: 'found',
  thumbnail: thumbnail(imageUrl),
  from,
  at: NOW,
});

const chapterPage = (signals: Partial<PageSignals>): PageSignals => ({
  pageTitle: 'Solo Leveling Chapter 37',
  url: CHAPTER_URL,
  ...signals,
});

const seriesPage = (signals: Partial<PageSignals>): PageSignals => ({
  pageTitle: 'Solo Leveling',
  url: SERIES_URL,
  ...signals,
});

const setUp = ({
  scans = [],
  covers = {},
  pages = [],
  images = {},
}: {
  scans?: ScanSnapshot[];
  covers?: Record<string, Cover>;
  pages?: PageSignals[];
  images?: Readonly<Record<string, ImageSize>>;
}) => {
  const coverRepository = new InMemoryCoverRepository(covers);
  const web = new InMemoryWeb(
    Object.fromEntries(pages.map((page) => [page.url, page])),
    images,
  );
  const telemetry = new InMemoryTelemetryRecorder();
  return {
    web,
    telemetry,
    coverOf: async (title: string) =>
      (await coverRepository.find([ScanTitle.of(title)])).get(title),
    backfillCovers: new BackfillCoversUseCase(
      new InMemoryScanRepository(scans),
      coverRepository,
      web,
      web,
      new FixedClock(NOW),
      telemetry,
    ),
  };
};
