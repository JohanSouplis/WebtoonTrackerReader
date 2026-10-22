import { Cover, Covers, CoverSource, isCoverDue, Thumbnail } from './cover';
import { PageSignals } from './parsed-page';
import { ScanSnapshot } from './scan-library';
import { ScanTitle } from './scan-title';
import { SeriesKey } from './series-key';
import { seriesPageUrlOf } from './series-page';
import { siteOf } from './site';

export type CoverCandidate = {
  readonly imageUrl: string;
  readonly refererUrl?: string;
};

export type CoverImage = {
  readonly width: number;
  readonly height: number;
  readonly thumbnail: Thumbnail;
};

export type CoverStep =
  | { readonly kind: 'download'; readonly candidate: CoverCandidate }
  | { readonly kind: 'read-page'; readonly url: string }
  | { readonly kind: 'done'; readonly cover: Cover };

type Lead =
  | {
      readonly kind: 'image';
      readonly candidate: CoverCandidate;
      readonly from: CoverSource;
    }
  | { readonly kind: 'page'; readonly url: string; readonly from: CoverSource };

const COVER_SHAPE = { minAspect: 0.5, maxAspect: 0.9, minWidth: 100 };

const SERIES_STRUCTURED_DATA_TYPES = ['ComicSeries', 'ComicStory', 'Book'];

const NOT_A_COVER_WORD_STARTS = [
  'page',
  'chap',
  'cap',
  'pic',
  'img',
  'episode',
];

const SITES_REFUSING_FOREIGN_REFERER = [
  { imageHost: 'uploads.mangadex.org', site: 'mangadex.org' },
];

const isCoverShaped = ({ width, height }: CoverImage): boolean =>
  width >= COVER_SHAPE.minWidth &&
  width / height >= COVER_SHAPE.minAspect &&
  width / height <= COVER_SHAPE.maxAspect;

const isNotACoverWord = (word: string): boolean =>
  /\d/.test(word) ||
  word === 'ch' ||
  NOT_A_COVER_WORD_STARTS.some((start) => word.startsWith(start));

const wordsOf = (text: string): string[] => SeriesKey.of(text).value.split(' ');

export const mayNameTheSeries = (
  alt: string,
  pageTexts: readonly string[],
): boolean => {
  const pageWords = new Set(pageTexts.flatMap(wordsOf));
  return wordsOf(alt).every(
    (word) => !isNotACoverWord(word) || pageWords.has(word),
  );
};

const ALT_NAMES_SERIES: Readonly<
  Record<CoverSource, (alt: string, title: ScanTitle) => boolean>
> = {
  page: (alt, title) => SeriesKey.of(alt).equals(title.seriesKey),
  'series-page': (alt, title) => {
    const words = ` ${SeriesKey.of(alt).value} `;
    const titleWords = ` ${title.seriesKey.value} `;
    return (
      words.includes(titleWords) &&
      !words.replace(titleWords, ' ').split(' ').some(isNotACoverWord)
    );
  },
};

const isOnSite = (host: string | undefined, site: string): boolean =>
  host === site || (host?.endsWith(`.${site}`) ?? false);

const candidateFrom = (imageUrl: string, pageUrl: string): CoverCandidate => {
  const refusing = SITES_REFUSING_FOREIGN_REFERER.find(
    ({ imageHost }) => siteOf(imageUrl) === imageHost,
  );
  return refusing && !isOnSite(siteOf(pageUrl), refusing.site)
    ? { imageUrl }
    : { imageUrl, refererUrl: pageUrl };
};

const imageUrlsOf = (
  page: PageSignals,
  title: ScanTitle,
  from: CoverSource,
): string[] => [
  ...(page.metaImages ?? []),
  ...(page.structuredData ?? []).flatMap(({ types, image }) =>
    image && types.some((type) => SERIES_STRUCTURED_DATA_TYPES.includes(type))
      ? [image]
      : [],
  ),
  ...(page.images ?? []).flatMap(({ src, alt }) =>
    ALT_NAMES_SERIES[from](alt, title) ? [src] : [],
  ),
];

export class CoverSearch {
  private readonly seen = new Set<string>();
  private leads: Lead[] = [];
  private found?: Cover;

  private constructor(
    readonly title: ScanTitle,
    private readonly now: Date,
  ) {}

  static onReadPage(
    page: PageSignals,
    title: ScanTitle,
    now: Date,
  ): CoverSearch {
    const search = new CoverSearch(title, now);
    search.follow(page, 'page');
    return search;
  }

  static fromLastReading(scan: ScanSnapshot, now: Date): CoverSearch {
    const search = new CoverSearch(ScanTitle.of(scan.title), now);
    search.queue(
      scan.seriesUrl
        ? [{ kind: 'page', url: scan.seriesUrl, from: 'series-page' }]
        : [{ kind: 'page', url: scan.url, from: 'page' }],
    );
    return search;
  }

  nextStep(): CoverStep {
    if (this.found) {
      return { kind: 'done', cover: this.found };
    }
    const [lead] = this.leads;
    switch (lead?.kind) {
      case undefined:
        return { kind: 'done', cover: { kind: 'missing', triedAt: this.now } };
      case 'image':
        return { kind: 'download', candidate: lead.candidate };
      case 'page':
        return { kind: 'read-page', url: lead.url };
    }
  }

  recordImage(image: CoverImage | undefined): void {
    const [lead, ...rest] = this.leads;
    this.leads = rest;
    if (image && isCoverShaped(image)) {
      this.found = {
        kind: 'found',
        thumbnail: image.thumbnail,
        from: lead.from,
        at: this.now,
      };
    }
  }

  recordPage(page: PageSignals | undefined): void {
    const [lead, ...rest] = this.leads;
    this.leads = rest;
    if (page) {
      this.follow(page, lead.from);
    }
  }

  private follow(page: PageSignals, from: CoverSource): void {
    const images = imageUrlsOf(page, this.title, from)
      .filter((url) => /^https?:\/\//.test(url))
      .map(
        (url): Lead => ({
          kind: 'image',
          candidate: candidateFrom(url, page.url),
          from,
        }),
      );
    const seriesPageUrl =
      from === 'page' ? seriesPageUrlOf(page, this.title) : undefined;
    const seriesPage: Lead[] = seriesPageUrl
      ? [{ kind: 'page', url: seriesPageUrl, from: 'series-page' }]
      : [];
    this.queue([...images, ...seriesPage]);
  }

  private queue(leads: readonly Lead[]): void {
    const unseen: Lead[] = [];
    for (const lead of leads) {
      const url = lead.kind === 'image' ? lead.candidate.imageUrl : lead.url;
      if (!this.seen.has(url)) {
        this.seen.add(url);
        unseen.push(lead);
      }
    }
    this.leads = [...unseen, ...this.leads];
  }
}

const BACKFILL_LIMIT = 10;

export const planCoverBackfill = (
  scans: readonly ScanSnapshot[],
  titles: readonly ScanTitle[],
  covers: Covers,
  now: Date,
): CoverSearch[][] => {
  const lanes = new Map<string, CoverSearch[]>();
  titles
    .filter((title) => isCoverDue(covers.get(title.value), now))
    .flatMap(
      (title) =>
        scans.find((scan) => ScanTitle.of(scan.title).equals(title)) ?? [],
    )
    .slice(0, BACKFILL_LIMIT)
    .forEach((scan) => {
      const site = siteOf(scan.seriesUrl ?? scan.url) ?? scan.url;
      lanes.set(site, [
        ...(lanes.get(site) ?? []),
        CoverSearch.fromLastReading(scan, now),
      ]);
    });
  return [...lanes.values()];
};
