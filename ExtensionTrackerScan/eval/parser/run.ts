import { parsePage } from '../../src/app/core/domain/page-title-parser';
import {
  PageSignals,
  VisitedPage,
} from '../../src/app/core/domain/parsed-page';
import { parseUnsupportedWebsitePage } from '../../src/app/core/domain/unsupported-website-page-parser';
import { Reading } from '../../src/app/core/domain/reading';
import { ScanTitle } from '../../src/app/core/domain/scan-title';
import { WEBSITE_PATTERNS } from '../../src/app/core/domain/website-patterns';
import { SUPPORTED_WEBSITE_PAGES } from '../../src/app/core/use-cases/supported-website-pages.fixture';
import {
  CHAPTER_PAGES,
  ChapterPage,
  HELD_OUT_CHAPTER_PAGES,
  HELD_OUT_OTHER_PAGES,
  HIDDEN_WORD_OTHER_PAGES,
  TUNING_CHAPTER_PAGES,
  TUNING_OTHER_PAGES,
  OTHER_PAGES,
} from './unsupported-website-pages';
import {
  CAPTURED_PAGES,
  CapturedPage,
  Expected,
  messagesOf,
} from './captured-pages';
import { parsePageSignals } from '../../src/page-signals-message';

type Recorded = { readonly title: string; readonly chapter: number };

type Outcome =
  | { readonly kind: 'exact' }
  | { readonly kind: 'missed' }
  | { readonly kind: 'wrong'; readonly recorded: Recorded }
  | { readonly kind: 'false-positive'; readonly recorded: Recorded };

type Slice = {
  readonly name: string;
  readonly chapterPages: readonly ChapterPage[];
  readonly otherPages: readonly VisitedPage[];
  readonly record: (page: VisitedPage) => Recorded | undefined;
};

const READ_AT = new Date('2025-01-01T00:00:00Z');

const recordedFrom = (reading?: Reading): Recorded | undefined =>
  reading && { title: reading.title.value, chapter: reading.chapter.value };

const recordedBy = (page: PageSignals): Recorded | undefined => {
  const parsed = parsePage(page, READ_AT);
  return recordedFrom(parsed.kind === 'reading' ? parsed.reading : undefined);
};

const isSupported = ({ url }: VisitedPage): boolean =>
  WEBSITE_PATTERNS.some(({ host }) => url.includes(host));

const outcomeOfChapterPage = (
  page: ChapterPage,
  recorded?: Recorded,
): Outcome => {
  if (!recorded) {
    return { kind: 'missed' };
  }
  return recorded.title.toLowerCase() === page.title.toLowerCase() &&
    recorded.chapter === page.chapter
    ? { kind: 'exact' }
    : { kind: 'wrong', recorded };
};

const percent = (part: number, whole: number): string =>
  whole === 0 ? '-' : `${((100 * part) / whole).toFixed(1)}%`;

const describe = (recorded: Recorded): string =>
  `"${recorded.title}" #${recorded.chapter}`;

const report = (slice: Slice): { recorded: number; exact: number } => {
  const chapterOutcomes = slice.chapterPages.map((page) => ({
    page,
    outcome: outcomeOfChapterPage(page, slice.record(page)),
  }));
  const falsePositives = slice.otherPages.flatMap((page) => {
    const recorded = slice.record(page);
    return recorded ? [{ page, recorded }] : [];
  });
  const count = (kind: Outcome['kind']): number =>
    chapterOutcomes.filter(({ outcome }) => outcome.kind === kind).length;
  const exact = count('exact');
  const wrong = count('wrong');
  const recorded = exact + wrong + falsePositives.length;
  console.log(`\n## ${slice.name}`);
  console.log(
    `chapter pages ${slice.chapterPages.length}: exact ${exact} (${percent(exact, slice.chapterPages.length)}), wrong ${wrong}, missed ${count('missed')}`,
  );
  console.log(
    `other pages ${slice.otherPages.length}: recorded ${falsePositives.length}`,
  );
  console.log(`precision ${percent(exact, recorded)} of ${recorded} recorded`);
  for (const { page, outcome } of chapterOutcomes) {
    if (outcome.kind === 'wrong') {
      console.log(
        `  WRONG  ${describe(outcome.recorded)} expected "${page.title}" #${page.chapter} <- ${page.pageTitle} | ${page.url}`,
      );
    }
  }
  for (const { page, outcome } of chapterOutcomes) {
    if (outcome.kind === 'missed') {
      console.log(`  MISSED ${page.pageTitle} | ${page.url}`);
    }
  }
  for (const { page, recorded: falsePositive } of falsePositives) {
    console.log(
      `  FALSE+ ${describe(falsePositive)} <- ${page.pageTitle} | ${page.url}`,
    );
  }
  return { recorded, exact };
};

const leakedSupportedPages = [
  ...CHAPTER_PAGES,
  ...OTHER_PAGES,
  ...TUNING_CHAPTER_PAGES,
  ...TUNING_OTHER_PAGES,
  ...HELD_OUT_CHAPTER_PAGES,
  ...HELD_OUT_OTHER_PAGES,
  ...HIDDEN_WORD_OTHER_PAGES,
].filter(isSupported);
if (leakedSupportedPages.length > 0) {
  throw new Error(
    `Unsupported-website corpus holds supported websites: ${leakedSupportedPages.map(({ url }) => url).join(', ')}`,
  );
}

const slices: Slice[] = [
  {
    name: 'catalog pages, catalog disabled (leave-one-site-out)',
    chapterPages: SUPPORTED_WEBSITE_PAGES.map(
      ([pageTitle, url, title, chapter]) => ({
        pageTitle,
        url,
        title,
        chapter,
      }),
    ),
    otherPages: [],
    record: (page) => recordedFrom(parseUnsupportedWebsitePage(page, READ_AT)),
  },
  {
    name: 'unsupported websites, chapter pages',
    chapterPages: CHAPTER_PAGES,
    otherPages: [],
    record: recordedBy,
  },
  {
    name: 'unsupported websites, other pages',
    chapterPages: [],
    otherPages: OTHER_PAGES,
    record: recordedBy,
  },
  {
    name: 'second round, written after the first design and tuned on',
    chapterPages: TUNING_CHAPTER_PAGES,
    otherPages: TUNING_OTHER_PAGES,
    record: recordedBy,
  },
  {
    name: 'third round, held out for one run, then used for the title-in-url rule',
    chapterPages: HELD_OUT_CHAPTER_PAGES,
    otherPages: HELD_OUT_OTHER_PAGES,
    record: recordedBy,
  },
  {
    name: 'other pages whose words hide a reading word (cartoon, scandal)',
    chapterPages: [],
    otherPages: HIDDEN_WORD_OTHER_PAGES,
    record: recordedBy,
  },
];

const totals = slices.map(report).reduce(
  (sum, { recorded, exact }) => ({
    recorded: sum.recorded + recorded,
    exact: sum.exact + exact,
  }),
  { recorded: 0, exact: 0 },
);
const chapterPageCount = slices.reduce(
  (sum, { chapterPages }) => sum + chapterPages.length,
  0,
);
console.log(
  `\n## overall\nrecall ${percent(totals.exact, chapterPageCount)} exact of ${chapterPageCount} chapter pages, precision ${percent(totals.exact, totals.recorded)} of ${totals.recorded} recorded`,
);

type InputMode = {
  readonly name: string;
  readonly record: (page: CapturedPage) => readonly Recorded[];
};

type CapturedOutcome =
  | 'exact'
  | 'missed'
  | 'wrong'
  | 'ignored'
  | 'false-positive';

const isSameSeries = (recorded: string, expected: string): boolean => {
  const title = ScanTitle.parse(recorded);
  return (
    title !== undefined &&
    title.seriesKey.match(ScanTitle.of(expected).seriesKey) === 'same'
  );
};

const isExact = (
  expected: Extract<Expected, { kind: 'reading' }>,
  recorded: Recorded,
): boolean =>
  expected.titles.some((title) => isSameSeries(recorded.title, title)) &&
  expected.chapters.includes(recorded.chapter);

const capturedOutcomeOf = (
  expected: Expected,
  recorded: readonly Recorded[],
): CapturedOutcome => {
  if (expected.kind === 'other') {
    return recorded.length > 0 ? 'false-positive' : 'ignored';
  }
  if (recorded.length === 0) {
    return 'missed';
  }
  return recorded.every((reading) => isExact(expected, reading))
    ? 'exact'
    : 'wrong';
};

const visitedPageOf = ({ capture }: CapturedPage): VisitedPage => ({
  pageTitle: capture.titleSettled ?? '',
  url: capture.finalUrl,
});

const recordedFromMessage = (message: unknown): Recorded[] => {
  const page = parsePageSignals(message);
  const recorded = page && recordedBy(page);
  return recorded ? [recorded] : [];
};

const INPUT_MODES: readonly InputMode[] = [
  {
    name: 'history import (title and url)',
    record: (page) => {
      const recorded = recordedBy(visitedPageOf(page));
      return recorded ? [recorded] : [];
    },
  },
  {
    name: 'content script (page signals)',
    record: (page) => messagesOf(page.capture).flatMap(recordedFromMessage),
  },
];

const expectedText = (expected: Expected): string =>
  expected.kind === 'reading'
    ? `"${expected.titles[0]}" #${expected.chapters.join('|')}`
    : expected.reason;

const reportCaptured = (
  name: string,
  pages: readonly CapturedPage[],
  listsPages: boolean,
): void => {
  console.log(`\n### ${name}`);
  for (const mode of INPUT_MODES) {
    const outcomes = pages.map((page) => {
      const recorded = mode.record(page);
      return {
        page,
        recorded,
        outcome: capturedOutcomeOf(page.expected, recorded),
      };
    });
    const count = (outcome: CapturedOutcome): number =>
      outcomes.filter((entry) => entry.outcome === outcome).length;
    const chapterPageCount = pages.filter(
      ({ expected }) => expected.kind === 'reading',
    ).length;
    console.log(
      `${mode.name}: chapter pages ${chapterPageCount}: exact ${count('exact')} (${percent(count('exact'), chapterPageCount)}), wrong ${count('wrong')}, missed ${count('missed')}; other pages ${pages.length - chapterPageCount}: recorded ${count('false-positive')}`,
    );
    if (!listsPages) {
      continue;
    }
    for (const { page, recorded, outcome } of outcomes) {
      if (outcome === 'wrong' || outcome === 'false-positive') {
        console.log(
          `  ${outcome === 'wrong' ? 'WRONG ' : 'FALSE+'} ${recorded.map(describe).join(', ')} expected ${expectedText(page.expected)} <- ${page.capture.titleSettled} | ${page.capture.finalUrl}`,
        );
      }
    }
    for (const { page, outcome } of outcomes) {
      if (outcome === 'missed') {
        console.log(
          `  MISSED ${expectedText(page.expected)} <- ${page.capture.titleSettled} | ${page.capture.finalUrl}`,
        );
      }
    }
  }
};

const groupedBy = (
  key: (page: CapturedPage) => string,
): Map<string, CapturedPage[]> =>
  CAPTURED_PAGES.reduce((groups, page) => {
    groups.set(key(page), [...(groups.get(key(page)) ?? []), page]);
    return groups;
  }, new Map<string, CapturedPage[]>());

console.log('\n## real chapter pages captured with Chromium, per partition');
for (const [partition, pages] of groupedBy(({ partition }) => partition)) {
  reportCaptured(partition, pages, true);
}
console.log('\n## real chapter pages captured with Chromium, per language');
for (const [language, pages] of groupedBy(({ language }) => language)) {
  reportCaptured(language, pages, false);
}
reportCaptured('all real pages', CAPTURED_PAGES, false);

type HostOutcomes = {
  readonly exact: number;
  readonly wrong: number;
};

const hostOutcomesOf = (
  outcomes: readonly CapturedOutcome[],
): HostOutcomes => ({
  exact: outcomes.filter((outcome) => outcome === 'exact').length,
  wrong: outcomes.filter(
    (outcome) => outcome === 'wrong' || outcome === 'false-positive',
  ).length,
});

const comparisonText = (
  label: string,
  count: number,
  catalog: HostOutcomes,
  generic: HostOutcomes,
): string =>
  count === 0
    ? ''
    : `${label} ${count}: catalog ${catalog.exact} exact ${catalog.wrong} wrong, generic ${generic.exact} exact ${generic.wrong} wrong`;

const recordedByGenericParser = (message: unknown): Recorded[] => {
  const page = parsePageSignals(message);
  const recorded =
    page && recordedFrom(parseUnsupportedWebsitePage(page, READ_AT));
  return recorded ? [recorded] : [];
};

const fixtureOutcomes = (
  host: string,
  record: (message: unknown) => readonly Recorded[],
): HostOutcomes =>
  hostOutcomesOf(
    SUPPORTED_WEBSITE_PAGES.filter(([, url]) => url.includes(host)).map(
      ([pageTitle, url, title, chapter]) =>
        capturedOutcomeOf(
          { kind: 'reading', titles: [title], chapters: [chapter] },
          record({ pageTitle, url }),
        ),
    ),
  );

const capturedOutcomes = (
  host: string,
  record: (message: unknown) => readonly Recorded[],
): HostOutcomes =>
  hostOutcomesOf(
    CAPTURED_PAGES.filter(({ capture }) => capture.finalUrl.includes(host)).map(
      (page) =>
        capturedOutcomeOf(
          page.expected,
          messagesOf(page.capture).flatMap(record),
        ),
    ),
  );

console.log('\n## catalog against the generic parser, per catalog host');
for (const { host } of WEBSITE_PATTERNS) {
  console.log(
    [
      host,
      comparisonText(
        'fixture rows',
        SUPPORTED_WEBSITE_PAGES.filter(([, url]) => url.includes(host)).length,
        fixtureOutcomes(host, recordedFromMessage),
        fixtureOutcomes(host, recordedByGenericParser),
      ),
      comparisonText(
        'captured pages',
        CAPTURED_PAGES.filter(({ capture }) => capture.finalUrl.includes(host))
          .length,
        capturedOutcomes(host, recordedFromMessage),
        capturedOutcomes(host, recordedByGenericParser),
      ),
    ]
      .filter(Boolean)
      .join(' | '),
  );
}
