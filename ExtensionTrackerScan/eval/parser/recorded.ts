import { parsePage } from '../../src/app/core/domain/page-title-parser';
import { PageSignals } from '../../src/app/core/domain/parsed-page';
import { Reading } from '../../src/app/core/domain/reading';
import { ScanTitle } from '../../src/app/core/domain/scan-title';
import { parsePageSignals } from '../../src/page-signals-message';
import { Expected } from './captured-pages';

export type Recorded = { readonly title: string; readonly chapter: number };

export type CapturedOutcome =
  | 'exact'
  | 'missed'
  | 'wrong'
  | 'ignored'
  | 'false-positive';

export const READ_AT = new Date('2025-01-01T00:00:00Z');

export const recordedFrom = (reading?: Reading): Recorded | undefined =>
  reading && { title: reading.title.value, chapter: reading.chapter.value };

export const recordedBy = (page: PageSignals): Recorded | undefined => {
  const parsed = parsePage(page, READ_AT);
  return recordedFrom(parsed.kind === 'reading' ? parsed.reading : undefined);
};

export const recordedFromMessage = (message: unknown): Recorded[] => {
  const page = parsePageSignals(message);
  const recorded = page && recordedBy(page);
  return recorded ? [recorded] : [];
};

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

export const capturedOutcomeOf = (
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
