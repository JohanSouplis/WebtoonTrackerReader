import { Cover } from '../domain/cover';
import { PageSignals } from '../domain/parsed-page';
import { ScanSnapshot } from '../domain/scan-library';
import { ScanTitle } from '../domain/scan-title';
import { FixedClock } from '../gateways/in-memory/fixed-clock.gateway';
import { InMemoryCoverRepository } from '../gateways/in-memory/in-memory-cover-repository.gateway';
import { InMemoryCrashReporter } from '../gateways/in-memory/in-memory-crash-reporter.gateway';
import { InMemoryReportSettingsRepository } from '../gateways/in-memory/in-memory-report-settings-repository.gateway';
import { InMemoryScanRepository } from '../gateways/in-memory/in-memory-scan-repository.gateway';
import {
  ImageSize,
  InMemoryWeb,
  thumbnailOf,
} from '../gateways/in-memory/in-memory-web.gateway';
import { PageSignalsMessage } from '../../../page-signals-message';
import { withCoverCandidatesOnly } from '../../../page-signals-reader';
import { COVER_PAGES, CoverPage, signalsOf } from './cover-pages.fixture';
import { BackfillCoversUseCase } from './backfill-covers.use-case';
import { RecordCoverUseCase } from './record-cover.use-case';
import { RecordVisitedPageUseCase } from './record-visited-page.use-case';
import { aScan } from './scans.fixture';

describe('RecordCoverUseCase', () => {
  it('should store the cover of the page read when its og:image is a portrait', async () => {
    const { page, images, seriesTitle } = coverPageOf('asurascans.com');
    const { readPage, coverOf, web } = setUp({ images });

    await readPage(page);

    expect(await coverOf(seriesTitle)).toMatchObject({
      kind: 'found',
      from: 'page',
      at: NOW,
    });
    expect(web.requests).toEqual([
      { url: page.metaImages?.[0], referer: page.url },
    ]);
  });

  it('should read the series page once when no image of the page read is a cover', async () => {
    const { page, seriesPage, images, seriesTitle } =
      coverPageOf('grimscans.com');
    const { readPage, coverOf, web } = setUp({
      pages: seriesPage ? [seriesPage] : [],
      images,
    });

    await readPage(page);

    expect(
      web.requests.filter(({ url }) => url === seriesPage?.url),
    ).toHaveLength(1);
    expect(await coverOf(seriesTitle)).toMatchObject({
      kind: 'found',
      from: 'series-page',
    });
  });

  it('should find the cover from the series link of a chapter page that lists a thousand episodes, in a message under 20 KB', async () => {
    const message = chapterPageListingEpisodes(1000);
    const { readPage, coverOf } = setUp({
      pages: [
        {
          pageTitle: 'Nano Machine | WEBTOON',
          url: SERIES_URL,
          metaImages: [COVER_URL],
        },
      ],
      images: { [COVER_URL]: PORTRAIT },
    });

    await readPage(signalsOf(message));

    expect(await coverOf('Nano Machine')).toEqual(
      found(COVER_URL, 'series-page'),
    );
    expect(
      JSON.stringify(withCoverCandidatesOnly(message)).length,
    ).toBeLessThan(20_000);
  });

  it('should keep the cover a backfill found while the search of the page read ended without one', async () => {
    const scanRepository = new InMemoryScanRepository([
      aScan({ title: 'Nano Machine', seriesUrl: SERIES_URL }),
    ]);
    const coverRepository = new InMemoryCoverRepository();
    const web = new InMemoryWeb(
      {
        [SERIES_URL]: {
          pageTitle: 'Nano Machine | WEBTOON',
          url: SERIES_URL,
          metaImages: [COVER_URL],
        },
      },
      { [COVER_URL]: PORTRAIT },
    );
    const clock = new FixedClock(NOW);

    await Promise.all([
      new BackfillCoversUseCase(
        scanRepository,
        coverRepository,
        web,
        web,
        clock,
      ).execute([ScanTitle.of('Nano Machine')]),
      new RecordCoverUseCase(
        scanRepository,
        coverRepository,
        web,
        web,
        clock,
      ).execute({
        ...catalogPage('Nano Machine', '4'),
        metaImages: [1, 2, 3, 4].map(
          (banner) => `https://webtoon-phinf.pstatic.net/banner-${banner}.jpg`,
        ),
      }),
    ]);

    expect(
      (await coverRepository.find([ScanTitle.of('Nano Machine')])).get(
        'Nano Machine',
      ),
    ).toEqual(found(COVER_URL, 'series-page'));
  });

  it('should record the cover as missing when neither the page nor its series page shows a cover', async () => {
    const { readPage, coverOf } = setUp({});

    await readPage(catalogPage('Nano Machine', '3'));

    expect(await coverOf('Nano Machine')).toEqual({
      kind: 'missing',
      triedAt: NOW,
    });
  });

  it('should store the cover under the title of the followed scan when the page names the series differently', async () => {
    const { readPage, coverOf } = setUp({
      followed: [aScan({ title: 'Nano Machine', readAt: new Date(0) })],
      images: { [COVER_URL]: PORTRAIT },
    });

    await readPage({
      ...catalogPage('Nanomachine', '3'),
      metaImages: [COVER_URL],
    });

    expect(await coverOf('Nano Machine')).toEqual(found(COVER_URL, 'page'));
  });

  it('should not download anything when the cover of the series was already found', async () => {
    const { readPage, web } = setUp({
      covers: { 'Nano Machine': found(COVER_URL, 'page') },
      images: { [COVER_URL]: PORTRAIT },
    });

    await readPage({
      ...catalogPage('Nano Machine', '4'),
      metaImages: [COVER_URL],
    });

    expect(web.requests).toEqual([]);
  });

  it('should not download anything when the page is not a reading', async () => {
    const { readPage, web } = setUp({ images: { [COVER_URL]: PORTRAIT } });

    await readPage({
      pageTitle: 'Asura Scans',
      url: 'https://asuracomic.net/',
      metaImages: [COVER_URL],
    });

    expect(web.requests).toEqual([]);
  });
});

const NOW = new Date('2025-03-10T12:00:00Z');
const COVER_URL = 'https://webtoon-phinf.pstatic.net/nano-machine/cover.jpg';
const PORTRAIT: ImageSize = { width: 720, height: 1030 };
const SERIES_URL =
  'https://www.webtoons.com/en/action/nano-machine/list?title_no=2212';

const coverPageOf = (host: string): CoverPage => {
  const coverPage = COVER_PAGES.find((page) => page.host === host);
  if (!coverPage) {
    throw new Error(`No cover page of ${host}`);
  }
  return coverPage;
};

const catalogPage = (title: string, chapter: string): PageSignals => ({
  pageTitle: `Episode ${chapter} | ${title}`,
  url: `https://www.webtoons.com/en/action/nano-machine/episode-${chapter}/viewer?title_no=2212&episode_no=${chapter}`,
});

const chapterPageListingEpisodes = (count: number): PageSignalsMessage => {
  const episodes = Array.from({ length: count }, (_, index) => index + 1);
  return {
    ...catalogPage('Nano Machine', '3'),
    structuredData: [],
    images: episodes.flatMap((episode) => [
      {
        src: `https://webtoon-phinf.pstatic.net/nano-machine/${episode}.jpg`,
        alt: `Nano Machine Episode ${episode}`,
      },
      { src: 'https://webtoons.com/bg.png', alt: 'image' },
    ]),
    links: [
      { href: '/', text: 'WEBTOON', isBreadcrumb: false },
      { href: SERIES_URL, text: 'Nano Machine', isBreadcrumb: false },
      ...episodes.map((episode) => ({
        href: `/en/action/nano-machine/episode-${episode}/viewer?title_no=2212&episode_no=${episode}`,
        text: `Episode ${episode}`,
        isBreadcrumb: false,
      })),
    ],
  };
};

const found = (imageUrl: string, from: 'page' | 'series-page'): Cover => {
  const thumbnail = thumbnailOf(imageUrl);
  if (!thumbnail) {
    throw new Error(`No thumbnail for ${imageUrl}`);
  }
  return { kind: 'found', thumbnail, from, at: NOW };
};

const setUp = ({
  followed = [],
  covers = {},
  pages = [],
  images = {},
}: {
  followed?: ScanSnapshot[];
  covers?: Record<string, Cover>;
  pages?: PageSignals[];
  images?: Readonly<Record<string, ImageSize>>;
}) => {
  const scanRepository = new InMemoryScanRepository(followed);
  const coverRepository = new InMemoryCoverRepository(covers);
  const web = new InMemoryWeb(
    Object.fromEntries(pages.map((page) => [page.url, page])),
    images,
  );
  const clock = new FixedClock(NOW);
  const recordVisitedPage = new RecordVisitedPageUseCase(
    scanRepository,
    new InMemoryCrashReporter(),
    new InMemoryReportSettingsRepository(),
    clock,
  );
  const recordCover = new RecordCoverUseCase(
    scanRepository,
    coverRepository,
    web,
    web,
    clock,
  );
  return {
    web,
    coverOf: async (title: string) =>
      (await coverRepository.find([ScanTitle.of(title)])).get(title),
    readPage: async (page: PageSignals) => {
      await recordVisitedPage.execute(page);
      await recordCover.execute(page);
    },
  };
};
