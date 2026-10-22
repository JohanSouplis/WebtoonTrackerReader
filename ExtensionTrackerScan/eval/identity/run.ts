import { Chapter } from '../../src/app/core/domain/chapter';
import { ScanLibrary } from '../../src/app/core/domain/scan-library';
import { ScanTitle } from '../../src/app/core/domain/scan-title';
import { SeriesMatch } from '../../src/app/core/domain/series-key';
import {
  CROSS_LANGUAGE_ALIASES,
  ENGLISH_REWORDINGS,
  HARD_NEGATIVES,
  HOMONYMS,
  SPELLING_VARIANTS,
  TitlePair,
} from './title-pairs';

type Slice = {
  readonly name: string;
  readonly pairs: readonly TitlePair[];
  readonly isSameSeries: boolean;
  readonly listsErrors: boolean;
};

const VERDICTS: readonly SeriesMatch[] = ['same', 'ambiguous', 'different'];
const FOLLOWED_AT = new Date('2025-01-01T00:00:00Z');
const READ_AT = new Date('2025-02-01T00:00:00Z');

const parsed = (text: string): ScanTitle => {
  const title = ScanTitle.parse(text);
  if (!title) {
    throw new Error(`Corpus title does not parse: "${text}"`);
  }
  return title;
};

const verdictOf = ([followedTitle, readTitle]: TitlePair): SeriesMatch =>
  ScanTitle.of(followedTitle).seriesKey.match(parsed(readTitle).seriesKey);

const isMergedByLibrary = ([followedTitle, readTitle]: TitlePair): boolean => {
  const library = ScanLibrary.restore([
    {
      title: followedTitle,
      chapter: 1,
      url: 'https://followed.example/chapter-1',
      readAt: FOLLOWED_AT,
      isFavorite: false,
    },
  ]);
  const title = parsed(readTitle);
  library.recordReading({
    title,
    chapter: Chapter.of(2),
    url: 'https://read.example/chapter-2',
    readAt: READ_AT,
  });
  return library.snapshot().length === 1;
};

const percent = (part: number, whole: number): string =>
  whole === 0 ? '-' : `${((100 * part) / whole).toFixed(1)}%`;

const describe = ([followedTitle, readTitle, source]: TitlePair): string =>
  `"${followedTitle}" ~ "${readTitle}" (${source})`;

const slices: readonly Slice[] = [
  {
    name: 'same-language spelling variants',
    pairs: SPELLING_VARIANTS,
    isSameSeries: true,
    listsErrors: true,
  },
  {
    name: 'same-language rewordings (alias source needed)',
    pairs: ENGLISH_REWORDINGS,
    isSameSeries: true,
    listsErrors: false,
  },
  {
    name: 'cross-language aliases (alias source needed)',
    pairs: CROSS_LANGUAGE_ALIASES,
    isSameSeries: true,
    listsErrors: false,
  },
  {
    name: 'hard negatives (sequels, spin-offs, remakes, novels, look-alikes)',
    pairs: HARD_NEGATIVES,
    isSameSeries: false,
    listsErrors: true,
  },
  {
    name: 'homonyms (identical titles, different series)',
    pairs: HOMONYMS,
    isSameSeries: false,
    listsErrors: true,
  },
];

const pairKeys = slices.flatMap(({ pairs }) =>
  pairs.map(
    ([followedTitle, readTitle]) => `${followedTitle}\u0000${readTitle}`,
  ),
);
const duplicates = pairKeys.filter(
  (key, index) => pairKeys.indexOf(key) !== index,
);
if (duplicates.length > 0) {
  throw new Error(`Corpus holds duplicate pairs: ${duplicates.join(', ')}`);
}

const totals = slices.reduce(
  (sum, slice) => {
    const merged = slice.pairs.filter(isMergedByLibrary);
    const errors = slice.isSameSeries
      ? slice.pairs.filter((pair) => !merged.includes(pair))
      : merged;
    console.log(`\n## ${slice.name}`);
    console.log(
      slice.isSameSeries
        ? `pairs ${slice.pairs.length}: merged ${merged.length} (recall ${percent(merged.length, slice.pairs.length)}), missed ${errors.length}`
        : `pairs ${slice.pairs.length}: kept apart ${slice.pairs.length - merged.length}, FALSE MERGES ${errors.length}`,
    );
    const verdicts = slice.pairs.map(verdictOf);
    console.log(
      `verdicts: ${VERDICTS.map((verdict) => `${verdict} ${verdicts.filter((each) => each === verdict).length}`).join(', ')}`,
    );
    if (slice.listsErrors) {
      for (const pair of errors) {
        console.log(
          `  ${slice.isSameSeries ? 'MISSED' : 'FALSE MERGE'} ${describe(pair)}`,
        );
      }
    }
    return slice.isSameSeries
      ? {
          ...sum,
          positives: sum.positives + slice.pairs.length,
          trueMerges: sum.trueMerges + merged.length,
        }
      : { ...sum, falseMerges: sum.falseMerges + merged.length };
  },
  { positives: 0, trueMerges: 0, falseMerges: 0 },
);

console.log(
  `\n## overall "same series"\nprecision ${percent(totals.trueMerges, totals.trueMerges + totals.falseMerges)} (${totals.falseMerges} false merges), recall ${percent(totals.trueMerges, totals.positives)} of ${totals.positives} same-series pairs`,
);
