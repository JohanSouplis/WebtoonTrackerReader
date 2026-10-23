import {
  ChapterCheck,
  currentLessons,
  StrategyKind,
} from '../../src/app/core/domain/chapter-check';
import { FetchedPage } from '../../src/app/core/domain/fetched-page';
import { ScanTitle } from '../../src/app/core/domain/scan-title';
import { siteOf } from '../../src/app/core/domain/site';

export type RecordedPage = {
  readonly status: number;
  readonly url: string;
  readonly text: string;
};

export type Corpus = 'series pages' | 'feeds';

export type NewChapterCase = {
  readonly corpus: Corpus;
  readonly host: string;
  readonly chapter: number;
  readonly url: string;
  readonly seriesUrl?: string;
  readonly truth: 'new' | 'none';
  readonly truthFrom: string;
};

export type StoredPage = Omit<RecordedPage, 'text'> & {
  readonly text: number;
};

export type Responses = {
  readonly cases: readonly NewChapterCase[];
  readonly pages: Readonly<
    Record<Corpus, Readonly<Record<string, StoredPage | 'unreachable'>>>
  >;
  readonly texts: readonly string[];
};

export const recordedPageOf =
  ({ pages, texts }: Responses, corpus: Corpus) =>
  (url: string): RecordedPage | 'unreachable' | undefined => {
    const stored = pages[corpus][url];
    return stored === undefined || stored === 'unreachable'
      ? stored
      : { ...stored, text: texts[stored.text] };
  };

export type Verdict =
  | {
      readonly kind: 'answered';
      readonly strategy: StrategyKind;
      readonly latest: number;
      readonly isNew: boolean;
    }
  | { readonly kind: 'unsupported'; readonly reason: string }
  | { readonly kind: 'blocked' | 'unreachable' | 'uncaptured' };

export type Replay = {
  readonly verdict: Verdict;
  readonly requests: readonly string[];
};

const CHECKED_AT = new Date('2026-10-23T00:00:00Z');

const fetchedPageOf = (
  recorded: RecordedPage | 'unreachable' | undefined,
): FetchedPage =>
  recorded === undefined || recorded === 'unreachable'
    ? { kind: 'unreachable' }
    : { kind: 'page', ...recorded };

export const replay = (
  testCase: NewChapterCase,
  pageOf: (url: string) => RecordedPage | 'unreachable' | undefined,
): Replay => {
  const check = new ChapterCheck(
    {
      title: ScanTitle.of(testCase.host),
      site: siteOf(testCase.url) ?? testCase.host,
      chapter: testCase.chapter,
      url: testCase.url,
      seriesUrl: testCase.seriesUrl,
    },
    testCase.chapter,
    currentLessons(
      testCase.corpus === 'series pages'
        ? { feed: { value: 'absent', learnedAt: CHECKED_AT } }
        : {},
      CHECKED_AT,
    ),
  );
  const requests: string[] = [];
  let isCaptured = true;
  let step = check.nextStep();
  while (step.kind === 'fetch') {
    requests.push(step.url);
    const recorded = pageOf(step.url);
    isCaptured &&= recorded !== undefined;
    check.recordPage(fetchedPageOf(recorded));
    step = check.nextStep();
  }
  const { outcome } = step;
  if (!isCaptured) {
    return { verdict: { kind: 'uncaptured' }, requests };
  }
  switch (outcome.kind) {
    case 'answered':
      return {
        verdict: {
          kind: 'answered',
          strategy: outcome.strategy,
          latest: outcome.latest,
          isNew: outcome.latest > testCase.chapter,
        },
        requests,
      };
    case 'unsupported':
      return {
        verdict: { kind: 'unsupported', reason: outcome.reason },
        requests,
      };
    default:
      return { verdict: { kind: outcome.kind }, requests };
  }
};
