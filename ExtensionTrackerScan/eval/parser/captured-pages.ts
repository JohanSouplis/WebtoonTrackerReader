import enAggregators from './captures/en-aggregators.json';
import heldOut from './captures/held-out.json';
import negatives from './captures/negatives.json';
import nonEnglish from './captures/non-english.json';
import official from './captures/official.json';
import { PageImage, PageLink } from '../../src/app/core/domain/parsed-page';
import { PageSignalsMessage } from '../../src/page-signals-message';

type StructuredDataCapture = {
  readonly type?: string | readonly string[] | null;
  readonly name?: string | null;
  readonly headline?: string | null;
  readonly position?: number | string | null;
};

export type Capture = {
  readonly host: string;
  readonly status: string;
  readonly language?: string;
  readonly seriesTitle: string | null;
  readonly seriesTitleFromUrlOnly?: string;
  readonly seriesTitleFromParentPage?: string;
  readonly chapter: number | string | null;
  readonly finalUrl: string;
  readonly titleAtLoad: string | null;
  readonly titleSettled: string | null;
  readonly ogTitle: string | null;
  readonly ogSiteName: string | null;
  readonly canonical: string | null;
  readonly h1: string | null;
  readonly breadcrumbText: string | null;
  readonly jsonLd: readonly StructuredDataCapture[] | null;
  readonly chapterSelectSelected: string | readonly string[] | null;
  readonly notes: string | null;
  readonly capturedAt?: string;
  readonly headings?: readonly string[];
  readonly links?: readonly PageLink[];
  readonly images?: readonly PageImage[];
  readonly bodyText?: string;
};

export type Expected =
  | {
      readonly kind: 'reading';
      readonly titles: readonly string[];
      readonly chapters: readonly number[];
    }
  | { readonly kind: 'other'; readonly reason: string };

export type DatedCapture = {
  readonly partition: string;
  readonly capturedOn: string;
  readonly capture: Capture;
};

export type CapturedPage = DatedCapture & {
  readonly language: string;
  readonly expected: Expected;
};

const titlesOf = (title: string): string[] => {
  const outsideParentheses = /^(.+?)\s*\([^()]*\)$/.exec(title);
  return outsideParentheses ? [title, outsideParentheses[1]] : [title];
};

const chaptersOf = (chapter: number | string): number[] => {
  if (typeof chapter === 'number') {
    return [chapter];
  }
  const [whole, part] = chapter.split(/[-+]/).map(Number);
  if (part === undefined) {
    return [whole];
  }
  return chapter.includes('+')
    ? [whole, part]
    : [whole, Number(`${whole}.${part}`)];
};

const expectedOf = (capture: Capture): Expected => {
  if (capture.notes?.startsWith('Novel chapter')) {
    return { kind: 'other', reason: 'novel chapter' };
  }
  if (capture.chapter === null) {
    return { kind: 'other', reason: 'episode without a chapter number' };
  }
  const title =
    capture.seriesTitle ??
    capture.seriesTitleFromUrlOnly ??
    capture.seriesTitleFromParentPage;
  if (!title) {
    throw new Error(`Capture without a series title: ${capture.finalUrl}`);
  }
  return {
    kind: 'reading',
    titles: titlesOf(title),
    chapters: chaptersOf(capture.chapter),
  };
};

type CaptureFile = {
  readonly partition: string;
  readonly capturedOn: string;
  readonly captures: readonly Capture[];
};

const CAPTURE_FILES: readonly CaptureFile[] = [
  {
    partition: 'en-aggregators',
    capturedOn: '2026-10-22',
    captures: enAggregators,
  },
  { partition: 'official', capturedOn: '2026-10-22', captures: official },
  { partition: 'non-english', capturedOn: '2026-10-22', captures: nonEnglish },
  { partition: 'negatives', capturedOn: '2026-10-23', captures: negatives },
];

const datedCapturesOf = (files: readonly CaptureFile[]): DatedCapture[] =>
  files.flatMap(({ partition, capturedOn, captures }) =>
    captures.map((capture) => ({
      partition,
      capturedOn: capture.capturedAt?.slice(0, 10) ?? capturedOn,
      capture,
    })),
  );

const capturedPagesOf = (captures: readonly DatedCapture[]): CapturedPage[] =>
  captures
    .filter(({ capture }) => capture.status === 'captured')
    .map((dated) => ({
      ...dated,
      language:
        dated.capture.language ??
        (dated.partition === 'official' ? 'official' : 'en'),
      expected: expectedOf(dated.capture),
    }));

export const CAPTURES: readonly DatedCapture[] = datedCapturesOf(CAPTURE_FILES);

export const CAPTURED_PAGES: readonly CapturedPage[] =
  capturedPagesOf(CAPTURES);

export const HELD_OUT_PAGES: readonly CapturedPage[] = capturedPagesOf(
  datedCapturesOf([
    { partition: 'held-out', capturedOn: '2026-10-23', captures: heldOut },
  ]),
);

const firstOf = (joined: string | null): string | undefined =>
  joined?.split(' || ')[0];

const selectedOptionsOf = ({
  chapterSelectSelected,
}: Capture): readonly string[] =>
  typeof chapterSelectSelected === 'string'
    ? chapterSelectSelected.split(' || ')
    : (chapterSelectSelected ?? []);

export const messagesOf = (capture: Capture): PageSignalsMessage[] =>
  [...new Set([capture.titleAtLoad, capture.titleSettled])].flatMap(
    (pageTitle) =>
      pageTitle
        ? [
            {
              pageTitle,
              url: capture.finalUrl,
              ogTitle: capture.ogTitle ?? undefined,
              ogSiteName: capture.ogSiteName ?? undefined,
              canonicalUrl: capture.canonical ?? undefined,
              heading: firstOf(capture.h1),
              headings: capture.headings,
              breadcrumb: firstOf(capture.breadcrumbText),
              text: capture.bodyText,
              structuredData: (capture.jsonLd ?? []).map(
                ({ type, name, headline, position }) => ({
                  type,
                  name,
                  headline,
                  position,
                }),
              ),
              selectedOptions: selectedOptionsOf(capture),
              images: capture.images,
              links: capture.links,
            },
          ]
        : [],
  );
