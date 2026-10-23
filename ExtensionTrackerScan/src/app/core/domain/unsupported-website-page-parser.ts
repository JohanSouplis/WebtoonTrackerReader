import { Chapter } from './chapter';
import {
  ARTICLE_WORDS,
  CHAPTER_SUFFIXES,
  CHAPTER_WORDS,
  NON_READING_PATHS,
  OTHER_MEDIA_WORDS,
  OTHER_NUMBER_WORDS,
  OTHER_PAGE_TYPES,
  QUALIFIERS,
  READING_MARKS,
  READING_TYPES,
  READING_WORDS,
  SERIES_TYPES,
  TITLE_CONNECTORS,
  TITLE_SEPARATOR,
  TITLE_STOP_WORDS,
  URL_CHAPTER_WORDS,
  WEBSITE_TYPES,
  withoutTitleNoise,
} from './page-lexicon';
import { PageSignals, StructuredDataItem } from './parsed-page';
import { Reading } from './reading';
import { ScanTitle } from './scan-title';

type ChapterMention = {
  readonly chapter: Chapter;
  readonly before: string;
  readonly after: string;
};

const byLength = (words: readonly string[]): string[] =>
  [...words].sort((left, right) => right.length - left.length);

const NUMBER = '(\\d+(?:[.,]\\d+)?)';

const MENTION = new RegExp(
  [
    `(?<![\\p{L}\\d])(?:${byLength(CHAPTER_WORDS).join('|')})\\.?\\s*(?:رقم\\s*)?[-:#]?\\s*${NUMBER}(?!\\d)`,
    `第\\s*${NUMBER}\\s*[${CHAPTER_SUFFIXES.join('')}]`,
    `(?<![\\p{L}\\d+])${NUMBER}\\s*[${CHAPTER_SUFFIXES.join('')}](?!\\p{L})`,
  ].join('|'),
  'giu',
);

const URL_MENTION = new RegExp(
  `(?<![a-z\\d])(?:${URL_CHAPTER_WORDS.join('|')})(?:_?no)?[-_./=]?(\\d+)(?:[.\\-_](\\d+))?(?![\\da-z])`,
  'gi',
);

const CONNECTOR = new RegExp(
  `^\\s*(?:${TITLE_CONNECTORS.join('|')})\\s+(.+)$`,
  'iu',
);

const normalizedText = (text: string): string =>
  text
    .normalize('NFC')
    .replace(/[０-９．]/g, (character) =>
      String.fromCharCode(character.charCodeAt(0) - 0xfee0),
    );

const decoded = (url: string): string => {
  try {
    return decodeURIComponent(url);
  } catch {
    return url;
  }
};

const folded = (text: string): string =>
  text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^\p{L}\p{N}]/gu, '');

const isBoundary = (after: string): boolean => {
  if (CONNECTOR.test(after)) {
    return true;
  }
  const word = /^\s*([\p{L}]+)(\.?\s*\d)?/u.exec(after);
  return (
    !word ||
    QUALIFIERS.includes(word[1].toLowerCase()) ||
    (word[2] !== undefined &&
      OTHER_NUMBER_WORDS.includes(word[1].toLowerCase()))
  );
};

const SEGMENT_END = new RegExp(`(?:${TITLE_SEPARATOR.source})$`, 'u');

const opensSegment = (before: string): boolean =>
  before.trim() === '' || SEGMENT_END.test(before);

const chapterMentionsIn = (text: string): ChapterMention[] =>
  [...normalizedText(text).matchAll(MENTION)].flatMap((match) => {
    const source = match.input;
    const before = source.substring(0, match.index);
    const after = source.substring(match.index + match[0].length);
    const chapter = Chapter.parse(match[1] ?? match[2] ?? match[3]);
    return chapter &&
      (match[1] === undefined || isBoundary(after) || opensSegment(before))
      ? [{ chapter, before, after }]
      : [];
  });

const displays = (text: string, chapter: Chapter): boolean =>
  chapterMentionsIn(text).some(
    (mention) => mention.chapter.value === chapter.value,
  );

const pathOf = (url: string): string =>
  decoded(url.replace(/^\w+:\/\/[^/?#]*/, ''));

const hostnameOf = (url: string): string =>
  url.replace(/^\w+:\/\/(www\.)?/, '').split(/[/?#]/)[0];

const hostOf = (url: string): string => folded(hostnameOf(url));

const pathSegments = (url: string): string[] => pathOf(url).split(/[/?#&]/);

const numbersOf = (whole: string, decimal?: string): number[] =>
  decimal ? [Number(whole), Number(`${whole}.${decimal}`)] : [Number(whole)];

const urlChapters = (url: string): number[] => [
  ...[...pathOf(url).matchAll(URL_MENTION)].flatMap(([, whole, decimal]) =>
    numbersOf(whole, decimal),
  ),
  ...pathSegments(url).flatMap((segment) => {
    const number = /^(\d+)(?:[.-](\d+))?$/.exec(segment);
    return number ? numbersOf(number[1], number[2]) : [];
  }),
];

const BARE_NUMBER = new RegExp(
  `(?:^|\\s|#)${NUMBER}(?=$|[\\s|:,)\\-–—])`,
  'gu',
);

const isNumberOfSomethingElse = (before: string): boolean => {
  const word = /(\p{L}+)\.?\s*#?\s*$/u.exec(before);
  return word !== null && OTHER_NUMBER_WORDS.includes(word[1].toLowerCase());
};

const bareNumbersIn = (text: string): ChapterMention[] =>
  normalizedText(text).search(MENTION) >= 0
    ? []
    : [...normalizedText(text).matchAll(BARE_NUMBER)].flatMap((match) => {
        const chapter = Chapter.parse(match[1]);
        return chapter &&
          !isNumberOfSomethingElse(match.input.substring(0, match.index))
          ? [
              {
                chapter,
                before: match.input
                  .substring(0, match.index + match[0].indexOf(match[1]))
                  .replace(/#$/, ''),
                after: match.input.substring(match.index + match[0].length),
              },
            ]
          : [];
      });

type Website = {
  readonly host: string;
  readonly label: string;
  readonly names: readonly string[];
};

const isWebsiteNode = ({ types }: StructuredDataItem): boolean =>
  types.some((type) => WEBSITE_TYPES.includes(type));

const structuredTexts = (page: PageSignals): string[] =>
  (page.structuredData ?? [])
    .filter((item) => !isWebsiteNode(item))
    .flatMap(({ name, headline }) =>
      [name, headline].flatMap((text) => text ?? []),
    );

const registeredNameOf = (hostname: string): string => {
  const labels = hostname.split('.').slice(0, -1);
  const name =
    labels.length > 1 && labels[labels.length - 1].length <= 3
      ? labels.slice(0, -1)
      : labels;
  return name[name.length - 1] ?? hostname;
};

const websiteOf = (page: PageSignals): Website => ({
  host: hostOf(page.url),
  label: folded(registeredNameOf(hostnameOf(page.url))),
  names: [
    page.ogSiteName,
    ...(page.ogSiteName ?? '').split(TITLE_SEPARATOR),
    ...(page.structuredData ?? [])
      .filter(isWebsiteNode)
      .map(({ name }) => name),
  ].flatMap((name) => (name ? [folded(name)] : [])),
});

const isExactWebsiteName = (text: string, website: Website): boolean =>
  [website.label, ...website.names].includes(folded(text));

const isWebsiteName = (text: string, website: Website): boolean => {
  const name = folded(text);
  const firstWord = folded(text.trim().split(/\s+/)[0]);
  return (
    name.length > 0 &&
    (website.host.includes(name) ||
      website.names.includes(name) ||
      (firstWord.length >= 4 && website.host.startsWith(firstWord)))
  );
};

const seriesNames = (page: PageSignals): string[] =>
  (page.structuredData ?? []).flatMap(({ types, name }) =>
    name && types.some((type) => SERIES_TYPES.includes(type)) ? [name] : [],
  );

const isOgIndependent = (page: PageSignals): boolean =>
  page.ogTitle !== undefined && folded(page.ogTitle) !== folded(page.pageTitle);

type ChapterDisplay = {
  readonly text: string;
  readonly isHeadline: boolean;
};

const chapterDisplays = (page: PageSignals): ChapterDisplay[] => [
  ...[page.pageTitle, page.ogTitle, page.heading].flatMap((text) =>
    text ? [{ text, isHeadline: true }] : [],
  ),
  ...[page.breadcrumb, ...(page.selectedOptions ?? [])].flatMap((text) =>
    text ? [{ text, isHeadline: false }] : [],
  ),
];

const chapterWitnesses = (page: PageSignals, displaying: string): string[] =>
  [
    isOgIndependent(page) ? page.ogTitle : undefined,
    page.heading,
    ...(page.headings ?? []),
    page.breadcrumb,
    ...structuredTexts(page),
    ...(page.selectedOptions ?? []),
  ].flatMap((text) => (text && text !== displaying ? [text] : []));

const chapterNumbersIn = (text: string): number[] =>
  [...normalizedText(text).matchAll(MENTION)].flatMap(
    (match) => Chapter.parse(match[1] ?? match[2] ?? match[3])?.value ?? [],
  );

const textConfirms = (text: string, chapter: Chapter): boolean => {
  const shown = new Set(chapterNumbersIn(text));
  return (
    shown.has(chapter.value) &&
    [...shown].every((value) => Math.abs(value - chapter.value) <= 1)
  );
};

const isChapterConfirmed = (
  page: PageSignals,
  display: ChapterDisplay,
  chapter: Chapter,
): boolean =>
  urlChapters(page.url).includes(chapter.value) ||
  (display.isHeadline &&
    (textConfirms(page.text ?? '', chapter) ||
      chapterWitnesses(page, display.text).some((text) =>
        displays(text, chapter),
      ) ||
      (page.selectedOptions ?? []).some(
        (option) => Number(option) === chapter.value,
      )));

const wordsOf = (texts: readonly (string | undefined)[]): string[] =>
  texts
    .flatMap((text) => text ?? [])
    .join(' ')
    .toLowerCase()
    .split(/\P{L}+/u);

const textWords = (page: PageSignals): string[] =>
  wordsOf([
    page.pageTitle,
    decoded(page.url),
    page.ogTitle,
    page.ogSiteName,
    page.heading,
    page.breadcrumb,
    ...structuredTexts(page),
  ]);

const namesReading = (words: readonly string[]): boolean => {
  const text = folded(words.join(' '));
  return (
    READING_WORDS.some(
      (word) => words.includes(word) || words.includes(`${word}s`),
    ) || READING_MARKS.some((mark) => text.includes(folded(mark)))
  );
};

const namesOnlyReading = (texts: readonly string[]): boolean => {
  const text = texts.join(' ').toLowerCase();
  return (
    namesReading(wordsOf(texts)) &&
    !OTHER_MEDIA_WORDS.some((word) => text.includes(word))
  );
};

const menuOrTextNamesReading = ({ links, text }: PageSignals): boolean =>
  namesOnlyReading((links ?? []).map(({ text: linkText }) => linkText)) ||
  namesOnlyReading(text ? [text] : []);

const isComicHost = (url: string): boolean =>
  READING_WORDS.some((word) => hostOf(url).includes(word));

const mentionsReading = (page: PageSignals): boolean =>
  isComicHost(page.url) ||
  namesReading(textWords(page)) ||
  (page.structuredData ?? []).some(({ types }) =>
    types.some((type) => READING_TYPES.includes(type)),
  ) ||
  menuOrTextNamesReading(page);

const mentionsOtherMedia = ({ pageTitle, url }: PageSignals): boolean => {
  const text =
    `${pageTitle} ${isComicHost(url) ? pathOf(url) : url}`.toLowerCase();
  return OTHER_MEDIA_WORDS.some((word) => text.includes(word));
};

const isArticle = (page: PageSignals): boolean => {
  const words = ` ${wordsOf([
    page.pageTitle,
    page.ogTitle,
    page.heading,
    page.breadcrumb,
  ]).join(' ')} `;
  return ARTICLE_WORDS.some((word) => words.includes(` ${word} `));
};

const isOtherPageKind = ({ structuredData }: PageSignals): boolean =>
  (structuredData ?? []).some(({ types }) =>
    types.some((type) => OTHER_PAGE_TYPES.includes(type)),
  );

const PROSE_PARAGRAPH_COUNT = 3;

const isProse = ({
  largeImageCount,
  longParagraphCount,
}: PageSignals): boolean =>
  largeImageCount === 0 && (longParagraphCount ?? 0) >= PROSE_PARAGRAPH_COUNT;

const isReadingPage = (page: PageSignals): boolean =>
  mentionsReading(page) &&
  !mentionsOtherMedia(page) &&
  !isArticle(page) &&
  !isOtherPageKind(page) &&
  !isProse(page) &&
  !pathSegments(page.url).some((segment) =>
    NON_READING_PATHS.includes(segment.toLowerCase()),
  );

const isTitle = (text: string): boolean =>
  /\p{L}/u.test(text) &&
  chapterMentionsIn(text).length === 0 &&
  text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .some((word) => word !== '' && !TITLE_STOP_WORDS.includes(word));

const SEPARATED = new RegExp(`(${TITLE_SEPARATOR.source})`, 'u');

type SegmentPlace = {
  readonly isFirst: boolean;
  readonly isLast: boolean;
};

const segmentsOf = (text: string): string[] =>
  text
    .split(SEPARATED)
    .filter((part, index) => index % 2 === 0 && withoutTitleNoise(part) !== '');

const wordCount = (text: string): number =>
  text.split(/[^\p{L}\p{N}]+/u).filter((word) => word !== '').length;

const withoutRepetition = (title: string): string => {
  const repeated = [...title.matchAll(/\s+/g)]
    .map(({ index }) => [title.substring(0, index), title.substring(index)])
    .find(
      ([first, second]) =>
        wordCount(first) >= 2 && folded(first) === folded(second),
    );
  return repeated ? repeated[1].trim() : title;
};

const titleSpan = (
  text: string,
  isDropped: (segment: string, place: SegmentPlace) => boolean,
): string[] => {
  const parts = text.split(SEPARATED);
  const filled = parts.flatMap((part, index) =>
    index % 2 === 0 && withoutTitleNoise(part) !== '' ? [index] : [],
  );
  const kept =
    filled.length > 1
      ? filled.filter(
          (index, position) =>
            !isDropped(parts[index], {
              isFirst: position === 0,
              isLast: position === filled.length - 1,
            }),
        )
      : filled;
  if (kept.length === 0) {
    return [];
  }
  const span = withoutRepetition(
    withoutTitleNoise(parts.slice(kept[0], kept[kept.length - 1] + 1).join('')),
  );
  return isTitle(span) ? [span] : [];
};

const containsNumber = (text: string, chapter: Chapter): boolean =>
  text
    .split(/[^\d.]+/)
    .some((token) => token !== '' && Number(token) === chapter.value);

const beforeCandidates = (
  mention: ChapterMention,
  website: Website,
): string[] => {
  const isWebsiteAtStart = (segment: string, { isFirst }: SegmentPlace) =>
    isFirst && isWebsiteName(segment, website);
  return [
    ...titleSpan(mention.before, () => false),
    ...titleSpan(mention.before, isWebsiteAtStart),
    ...titleSpan(
      mention.before,
      (segment, place) =>
        isWebsiteAtStart(segment, place) ||
        containsNumber(segment, mention.chapter),
    ),
  ];
};

const CLOSING_BRACKET = /^\s*[\]】」)]\s*/;
const PIECE_SEPARATOR = /\s*[|｜]\s*/;

const titleAfterMention = (mentionPiece: string): string =>
  CLOSING_BRACKET.test(mentionPiece)
    ? mentionPiece.replace(CLOSING_BRACKET, '')
    : mentionPiece.split(SEPARATED).slice(1).join('');

const afterCandidates = (after: string, website: Website): string[] => {
  const connected = CONNECTOR.exec(after);
  const [mentionPiece, ...pieces] = after.split(PIECE_SEPARATOR);
  const isWebsiteAtEnd = (segment: string, { isLast }: SegmentPlace) =>
    isLast && isWebsiteName(segment, website);
  const nextTitles = titleSpan(
    pieces
      .filter(
        (piece, index) =>
          !(index === pieces.length - 1 && isWebsiteName(piece, website)),
      )
      .join(' | '),
    isWebsiteAtEnd,
  );
  return [
    ...(connected ? titleSpan(connected[1], isWebsiteAtEnd) : []),
    ...(nextTitles.length > 0
      ? [...nextTitles, ...titleSpan(pieces[0], () => false)]
      : titleSpan(titleAfterMention(mentionPiece), isWebsiteAtEnd)),
  ].filter((candidate) => !isExactWebsiteName(candidate, website));
};

const textWitnesses = (page: PageSignals, displaying: string): string[] =>
  [
    isOgIndependent(page) ? page.ogTitle : undefined,
    page.heading,
    ...(page.headings ?? []),
    page.breadcrumb,
    ...structuredTexts(page),
    ...(page.links ?? []).map(({ text }) => text),
  ].flatMap((text) => (text && text !== displaying ? [folded(text)] : []));

const titleWitnesses = (page: PageSignals, displaying: string): string[] => [
  ...[page.url, page.canonicalUrl].flatMap((url) =>
    url ? pathSegments(url).map(folded) : [],
  ),
  ...textWitnesses(page, displaying),
];

const titleTextsOf = ({ before, after }: ChapterMention): string[] => {
  const title = titleAfterMention(after.split(PIECE_SEPARATOR)[0]);
  return CLOSING_BRACKET.test(after) ? [title] : [before, title];
};

const segmentCandidates = (
  mention: ChapterMention,
  website: Website,
): string[] =>
  titleTextsOf(mention)
    .flatMap(segmentsOf)
    .filter(
      (segment) =>
        !isWebsiteName(segment, website) &&
        !containsNumber(segment, mention.chapter),
    )
    .flatMap((segment) => titleSpan(segment, () => false));

const isSlugNoise = (token: string): boolean =>
  /^\d+$/.test(token) ||
  (token.length >= 5 && /\d/.test(token)) ||
  URL_CHAPTER_WORDS.includes(token.toLowerCase());

const slugOf = (segment: string): string => {
  const tokens = segment.split(/[-_.~+]+/).filter((token) => token !== '');
  const start = tokens.findIndex((token) => !isSlugNoise(token));
  const end =
    tokens.length -
    [...tokens].reverse().findIndex((token) => !isSlugNoise(token));
  return start < 0 ? '' : folded(tokens.slice(start, end).join(' '));
};

const seriesSlugsOf = (page: PageSignals): string[] =>
  [page.url, page.canonicalUrl]
    .flatMap((url) => (url ? pathSegments(url).slice(2) : []))
    .map(slugOf)
    .filter((slug) => slug !== '');

const namedOnPage = ({ headings, links }: PageSignals): string[] => [
  ...(headings ?? []),
  ...(links ?? [])
    .filter(({ isBreadcrumb }) => isBreadcrumb)
    .map(({ text }) => text),
  ...(links ?? [])
    .filter(({ isBreadcrumb }) => !isBreadcrumb)
    .map(({ text }) => text),
];

const titleNamedBySlug = (
  page: PageSignals,
  website: Website,
): string | undefined => {
  const slugs = seriesSlugsOf(page);
  return namedOnPage(page)
    .flatMap((text) => titleSpan(text, () => false))
    .find(
      (candidate) =>
        !isWebsiteName(candidate, website) && slugs.includes(folded(candidate)),
    );
};

const pageTitleCandidates = (page: PageSignals, website: Website): string[] =>
  titleSpan(
    page.pageTitle,
    (segment, { isFirst, isLast }) =>
      (isFirst || isLast) && isWebsiteName(segment, website),
  );

const titleOf = (
  page: PageSignals,
  display: ChapterDisplay,
  mention: ChapterMention,
): string | undefined => {
  const website = websiteOf(page);
  const series = seriesNames(page).find((name) =>
    folded(display.text).includes(folded(name)),
  );
  if (series) {
    return series;
  }
  const witnesses = titleWitnesses(page, display.text);
  const before = beforeCandidates(mention, website);
  const surrounding = [...before, ...afterCandidates(mention.after, website)];
  const confirmed =
    surrounding.find((candidate) =>
      [...witnesses, ...seriesSlugsOf(page)].includes(folded(candidate)),
    ) ??
    surrounding.find((candidate) =>
      witnesses.some((witness) => witness.includes(folded(candidate))),
    ) ??
    (display.text === page.pageTitle
      ? undefined
      : pageTitleCandidates(page, website).find((candidate) =>
          witnesses.some(
            (witness) =>
              witness.includes(folded(candidate)) &&
              witness !== folded(candidate),
          ),
        ));
  if (confirmed) {
    return confirmed;
  }
  const confirmedSegment = segmentCandidates(mention, website).find(
    (candidate) =>
      textWitnesses(page, display.text).some((witness) =>
        witness.includes(folded(candidate)),
      ),
  );
  if (confirmedSegment) {
    return confirmedSegment;
  }
  const namedBySlug = titleNamedBySlug(page, website);
  if (namedBySlug) {
    return namedBySlug;
  }
  return display.isHeadline &&
    segmentsOf(mention.before).length === 1 &&
    before.length > 0
    ? before[0]
    : undefined;
};

export const parseUnsupportedWebsitePage = (
  page: PageSignals,
  readAt: Date,
): Reading | undefined => {
  if (!isReadingPage(page)) {
    return undefined;
  }
  for (const display of chapterDisplays(page)) {
    const mention =
      chapterMentionsIn(display.text)[0] ??
      (display.isHeadline
        ? bareNumbersIn(display.text).find(
            ({ chapter }) =>
              urlChapters(page.url).includes(chapter.value) ||
              chapterWitnesses(page, display.text).some((witness) =>
                displays(witness, chapter),
              ),
          )
        : undefined);
    if (mention && isChapterConfirmed(page, display, mention.chapter)) {
      const title = ScanTitle.parse(titleOf(page, display, mention) ?? '');
      return title
        ? { title, chapter: mention.chapter, url: page.url, readAt }
        : undefined;
    }
  }
  return undefined;
};
