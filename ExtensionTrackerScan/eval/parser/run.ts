import { parsePage } from '../../src/app/core/domain/page-title-parser';
import { VisitedPage } from '../../src/app/core/domain/parsed-page';
import { parseUnsupportedWebsitePage } from '../../src/app/core/domain/unsupported-website-page-parser';
import { Reading } from '../../src/app/core/domain/reading';
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

const recordedBy = (page: VisitedPage): Recorded | undefined => {
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
