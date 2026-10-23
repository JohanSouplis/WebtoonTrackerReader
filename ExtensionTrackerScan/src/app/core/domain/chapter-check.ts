import {
  answerOf,
  chaptersInFeed,
  chaptersListedOn,
  FetchedPage,
  headingsOf,
  isFeed,
  isNotFoundPage,
  isRenumbered,
  lastListPageOf,
  ListedChapter,
  showsChapter,
} from './fetched-page';
import { ScanTitle } from './scan-title';
import { siteOf } from './site';

export type StrategyKind = 'feed' | 'series-page' | 'next-chapter-url';

export const UNSUPPORTED_REASONS = [
  'no-series-page',
  'no-chapter-list',
  'echoes-any-chapter',
  'script-only',
] as const;

export type UnsupportedReason = (typeof UNSUPPORTED_REASONS)[number];

export const LESSON_VALUES = {
  feed: ['works', 'absent'],
  'series-page': ['works', 'no-chapter-list'],
  'far-chapter': ['refused', 'echoed'],
  'current-chapter': ['shown', 'hidden'],
} as const;

type LessonValues = {
  readonly [L in keyof typeof LESSON_VALUES]: (typeof LESSON_VALUES)[L][number];
};

export type Lesson = keyof LessonValues;

export type LessonsLearned = { readonly [L in Lesson]?: LessonValues[L] };

export type HostLessons = {
  readonly [L in Lesson]?: Learned<LessonValues[L]>;
};

export type WatchedScan = {
  readonly title: ScanTitle;
  readonly site: string;
  readonly chapter: number;
  readonly url: string;
  readonly seriesUrl?: string;
};

export type CheckOutcome =
  | {
      readonly kind: 'answered';
      readonly strategy: StrategyKind;
      readonly latest: number;
      readonly url?: string;
    }
  | { readonly kind: 'unsupported'; readonly reason: UnsupportedReason }
  | { readonly kind: 'blocked' }
  | { readonly kind: 'unreachable' };

export type CheckStep =
  | { readonly kind: 'fetch'; readonly url: string }
  | {
      readonly kind: 'done';
      readonly outcome: CheckOutcome;
      readonly lessons: LessonsLearned;
    };

type StrategyStep =
  | { readonly kind: 'fetch'; readonly url: string }
  | {
      readonly kind: 'answer';
      readonly latest: ListedChapter;
      readonly lessons: LessonsLearned;
    }
  | {
      readonly kind: 'pass';
      readonly reason: UnsupportedReason;
      readonly lessons: LessonsLearned;
    };

type StrategyInput = {
  readonly scan: WatchedScan;
  readonly knownLatest: number;
  readonly lessons: LessonsLearned;
  readonly pages: readonly FetchedPage[];
};

type Strategy = {
  readonly kind: StrategyKind;
  readonly onRefusal: 'pass' | 'back-off';
  readonly skipReasonOf: (
    lessons: LessonsLearned,
  ) => UnsupportedReason | undefined;
  readonly stepOf: (input: StrategyInput) => StrategyStep;
};

type Feed = {
  readonly url: string;
  readonly isOfSeries: (url: URL) => boolean;
};

type FeedRule = {
  readonly appliesTo: (site: string) => boolean;
  readonly feedOf: (scan: WatchedScan) => Feed | undefined;
};

const FAR_CHAPTER_OFFSET = 4000;

const LESSON_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

const urlOf = (text: string): URL | undefined => {
  try {
    return new URL(text);
  } catch {
    return undefined;
  }
};

const pass = (
  reason: UnsupportedReason,
  lessons: LessonsLearned = {},
): StrategyStep => ({ kind: 'pass', reason, lessons });

const answer = (
  latest: ListedChapter,
  lessons: LessonsLearned,
): StrategyStep => ({ kind: 'answer', latest, lessons });

const highestOf = (
  chapters: readonly ListedChapter[],
): ListedChapter | undefined =>
  chapters.reduce<ListedChapter | undefined>(
    (highest, listed) =>
      highest === undefined || listed.chapter > highest.chapter
        ? listed
        : highest,
    undefined,
  );

const webtoonFeedOf = ({ url }: WatchedScan): Feed | undefined => {
  const reading = urlOf(url);
  const [language, genre, series] =
    reading?.pathname.split('/').filter(Boolean) ?? [];
  const titleNumber = reading?.searchParams.get('title_no');
  return language && genre && series && titleNumber
    ? {
        url: `https://www.webtoons.com/${language}/${genre}/${series}/rss?title_no=${titleNumber}`,
        isOfSeries: (item) => item.searchParams.get('title_no') === titleNumber,
      }
    : undefined;
};

const categoryFeedOf = ({ seriesUrl }: WatchedScan): Feed | undefined => {
  const series = seriesUrl ? urlOf(seriesUrl) : undefined;
  const slug = series?.pathname.split('/').filter(Boolean).pop()?.toLowerCase();
  return series && slug
    ? {
        url: `${series.origin}/category/${slug}/feed/`,
        isOfSeries: (item) => item.pathname.toLowerCase().includes(slug),
      }
    : undefined;
};

const FEED_RULES: readonly FeedRule[] = [
  { appliesTo: (site) => site === 'webtoons.com', feedOf: webtoonFeedOf },
  { appliesTo: () => true, feedOf: categoryFeedOf },
];

const feedStep = ({ scan, pages }: StrategyInput): StrategyStep => {
  const feed = FEED_RULES.find(({ appliesTo }) => appliesTo(scan.site))?.feedOf(
    scan,
  );
  if (!feed) {
    return pass('no-chapter-list');
  }
  const [page] = pages;
  if (!page) {
    return { kind: 'fetch', url: feed.url };
  }
  const items =
    page.kind === 'page' && answerOf(page) === 'ok' && isFeed(page.text)
      ? chaptersInFeed(page, feed.isOfSeries)
      : [];
  const latest = highestOf(items);
  if (!latest) {
    return pass('no-chapter-list', { feed: 'absent' });
  }
  return latest.chapter >= scan.chapter
    ? answer(latest, { feed: 'works' })
    : pass('no-chapter-list');
};

const isTrustedList = (
  listed: readonly ListedChapter[],
  chapter: number,
): boolean =>
  listed.length >= 3 &&
  (highestOf(listed)?.chapter ?? -1) >= chapter &&
  !isRenumbered(listed);

const seriesPageStep = ({ scan, pages }: StrategyInput): StrategyStep => {
  const { seriesUrl } = scan;
  if (!seriesUrl || siteOf(seriesUrl) !== scan.site) {
    return pass('no-series-page');
  }
  const [seriesPage, lastListPage] = pages;
  if (!seriesPage) {
    return { kind: 'fetch', url: seriesUrl };
  }
  if (seriesPage.kind !== 'page' || answerOf(seriesPage) !== 'ok') {
    return pass('no-series-page');
  }
  const listed = chaptersListedOn(seriesPage, seriesUrl);
  const lastListPageUrl = lastListPageOf(seriesPage);
  if (
    !isTrustedList(listed, scan.chapter) &&
    !lastListPage &&
    lastListPageUrl
  ) {
    return { kind: 'fetch', url: lastListPageUrl };
  }
  const all = [
    ...listed,
    ...(lastListPage?.kind === 'page' && answerOf(lastListPage) === 'ok'
      ? chaptersListedOn(lastListPage, seriesUrl)
      : []),
  ];
  const latest = highestOf(all);
  if (!latest) {
    return pass('no-chapter-list', { 'series-page': 'no-chapter-list' });
  }
  return isTrustedList(all, scan.chapter)
    ? answer(latest, { 'series-page': 'works' })
    : pass('no-chapter-list');
};

const sameUrl = (url: string, other: string): boolean =>
  url.replace(/\/+$/, '').toLowerCase() ===
  other.replace(/\/+$/, '').toLowerCase();

export const chapterUrlWith = (
  url: string,
  chapter: number,
  replacement: number,
): string | undefined => {
  const parsed = urlOf(url);
  if (!parsed) {
    return undefined;
  }
  const pathStart = `${parsed.protocol}//${parsed.host}`.length;
  const number = String(chapter).replace('.', '\\.');
  const hits = [
    ...url.matchAll(new RegExp(`(?<![\\d.])0*${number}(?:\\.00)?(?!\\d)`, 'g')),
  ].filter(
    ({ index, 0: token }) =>
      index >= pathStart &&
      !(
        /\p{L}/u.test(url[index - 1] ?? '') &&
        /\p{L}/u.test(url[index + token.length] ?? '')
      ),
  );
  const last = hits.at(-1);
  if (!last) {
    return undefined;
  }
  const token = last[0];
  const width = token.startsWith('0') ? token.split('.')[0].length : 0;
  const replaced =
    String(replacement).padStart(width, '0') +
    (token.endsWith('.00') ? '.00' : '');
  return (
    url.slice(0, last.index) + replaced + url.slice(last.index + token.length)
  );
};

const showsNextChapter = (
  probe: FetchedPage,
  probeUrl: string,
  next: number,
): boolean | undefined => {
  if (probe.kind !== 'page') {
    return undefined;
  }
  switch (answerOf(probe)) {
    case 'missing':
      return false;
    case 'ok':
      break;
    default:
      return undefined;
  }
  if (!sameUrl(probe.url, probeUrl) && !showsChapter(probe.url, next)) {
    return false;
  }
  return (
    !isNotFoundPage(probe.text) && showsChapter(headingsOf(probe.text), next)
  );
};

const nextChapterStep = ({
  scan,
  knownLatest,
  lessons,
  pages,
}: StrategyInput): StrategyStep => {
  const next = Math.floor(knownLatest) + 1;
  const probeUrl = chapterUrlWith(scan.url, scan.chapter, next);
  const farChapter = Math.floor(scan.chapter) + FAR_CHAPTER_OFFSET;
  const farUrl = chapterUrlWith(scan.url, scan.chapter, farChapter);
  if (!probeUrl || !farUrl) {
    return pass('no-chapter-list');
  }
  const [probe, calibration] = pages;
  if (!probe) {
    return { kind: 'fetch', url: probeUrl };
  }
  const isNext = showsNextChapter(probe, probeUrl, next);
  if (isNext === undefined) {
    return pass('no-chapter-list');
  }
  if (isNext) {
    if (lessons['far-chapter'] === 'refused') {
      return answer({ chapter: next, url: probeUrl }, {});
    }
    if (!calibration) {
      return { kind: 'fetch', url: farUrl };
    }
    const echoes =
      calibration.kind === 'page' &&
      calibration.status === 200 &&
      showsChapter(headingsOf(calibration.text), farChapter);
    return echoes
      ? pass('echoes-any-chapter', { 'far-chapter': 'echoed' })
      : answer({ chapter: next, url: probeUrl }, { 'far-chapter': 'refused' });
  }
  const knownChapter = { chapter: knownLatest, url: scan.url };
  if (lessons['current-chapter'] === 'shown') {
    return answer(knownChapter, {});
  }
  if (!calibration) {
    return { kind: 'fetch', url: scan.url };
  }
  const isShown =
    calibration.kind === 'page' &&
    answerOf(calibration) === 'ok' &&
    showsChapter(headingsOf(calibration.text), scan.chapter);
  return isShown
    ? answer(knownChapter, { 'current-chapter': 'shown' })
    : pass('script-only', { 'current-chapter': 'hidden' });
};

const STRATEGIES: readonly Strategy[] = [
  {
    kind: 'feed',
    onRefusal: 'pass',
    skipReasonOf: (lessons) =>
      lessons.feed === 'absent' ? 'no-chapter-list' : undefined,
    stepOf: feedStep,
  },
  {
    kind: 'series-page',
    onRefusal: 'back-off',
    skipReasonOf: (lessons) =>
      lessons['series-page'] === 'no-chapter-list'
        ? 'no-chapter-list'
        : undefined,
    stepOf: seriesPageStep,
  },
  {
    kind: 'next-chapter-url',
    onRefusal: 'back-off',
    skipReasonOf: (lessons) => {
      if (lessons['far-chapter'] === 'echoed') {
        return 'echoes-any-chapter';
      }
      return lessons['current-chapter'] === 'hidden'
        ? 'script-only'
        : undefined;
    },
    stepOf: nextChapterStep,
  },
];

export type Learned<V> = { readonly value: V; readonly learnedAt: Date };

const valueIfCurrent = <V>(
  learned: Learned<V> | undefined,
  now: Date,
): V | undefined =>
  learned && now.getTime() - learned.learnedAt.getTime() < LESSON_LIFETIME_MS
    ? learned.value
    : undefined;

const kept = <V extends string>(
  stored: Learned<V> | undefined,
  learned: V | undefined,
  now: Date,
): Learned<V> | undefined => {
  if (learned === undefined) {
    return stored;
  }
  return learned !== 'works' && valueIfCurrent(stored, now) === 'works'
    ? stored
    : { value: learned, learnedAt: now };
};

export const currentLessons = (
  lessons: HostLessons,
  now: Date,
): LessonsLearned => ({
  feed: valueIfCurrent(lessons.feed, now),
  'series-page': valueIfCurrent(lessons['series-page'], now),
  'far-chapter': valueIfCurrent(lessons['far-chapter'], now),
  'current-chapter': valueIfCurrent(lessons['current-chapter'], now),
});

export const lessonsAfter = (
  stored: HostLessons,
  learned: LessonsLearned,
  now: Date,
): HostLessons => ({
  feed: kept(stored.feed, learned.feed, now),
  'series-page': kept(stored['series-page'], learned['series-page'], now),
  'far-chapter': kept(stored['far-chapter'], learned['far-chapter'], now),
  'current-chapter': kept(
    stored['current-chapter'],
    learned['current-chapter'],
    now,
  ),
});

export class ChapterCheck {
  private strategyIndex = 0;
  private pages: FetchedPage[] = [];
  private learned: LessonsLearned = {};
  private reason: UnsupportedReason = 'no-chapter-list';
  private ended?: CheckOutcome;

  constructor(
    readonly scan: WatchedScan,
    private readonly knownLatest: number,
    private readonly lessons: LessonsLearned,
  ) {}

  nextStep(): CheckStep {
    while (!this.ended) {
      const strategy = STRATEGIES[this.strategyIndex];
      if (!strategy) {
        this.ended = { kind: 'unsupported', reason: this.reason };
        break;
      }
      if (
        strategy.onRefusal === 'back-off' &&
        this.pages.some((page) => answerOf(page) === 'blocked')
      ) {
        this.ended = { kind: 'blocked' };
        break;
      }
      const lessons = { ...this.lessons, ...this.learned };
      const skipReason =
        this.pages.length === 0 ? strategy.skipReasonOf(lessons) : undefined;
      const step: StrategyStep = skipReason
        ? pass(skipReason)
        : strategy.stepOf({
            scan: this.scan,
            knownLatest: this.knownLatest,
            lessons,
            pages: this.pages,
          });
      if (step.kind === 'fetch') {
        return step;
      }
      this.learned = { ...this.learned, ...step.lessons };
      if (step.kind === 'answer') {
        this.ended = {
          kind: 'answered',
          strategy: strategy.kind,
          latest: step.latest.chapter,
          url: step.latest.url,
        };
        break;
      }
      this.reason = step.reason;
      this.strategyIndex += 1;
      this.pages = [];
    }
    return { kind: 'done', outcome: this.ended, lessons: this.learned };
  }

  recordPage(page: FetchedPage): void {
    if (page.kind === 'unreachable') {
      this.ended = { kind: 'unreachable' };
      return;
    }
    this.pages = [...this.pages, page];
  }
}
