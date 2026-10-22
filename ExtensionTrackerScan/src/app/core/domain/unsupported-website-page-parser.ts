import { Chapter } from './chapter';
import { VisitedPage } from './parsed-page';
import { Reading } from './reading';
import { ScanTitle } from './scan-title';

type ChapterMention = {
  readonly chapter: Chapter;
  readonly before: string;
  readonly after: string;
};

const TITLE_CHAPTER_WORDS = [
  'chapter',
  'chapitre',
  'capítulo',
  'capitulo',
  'chap',
  'ch',
  'episode',
  'épisode',
  'ep',
];
const URL_CHAPTER_WORDS = [
  'chapters',
  'chapter',
  'chapitre',
  'capitulo',
  'chap',
  'ch',
  'c',
  'episodes',
  'episode',
  'ep',
];
const READING_WORDS = [
  'manga',
  'manhwa',
  'manhua',
  'webtoon',
  'toon',
  'comic',
  'scan',
];
const OTHER_MEDIA_WORDS = [
  'anime',
  'novel',
  'podcast',
  'wiki',
  'fandom',
  'reddit',
  'youtube',
  'watch',
  'video',
];
const NON_READING_PATHS = ['course'];
const QUALIFIERS = ['online', 'free', 'vf', 'raw', 'english', 'eng', 'vostfr'];
const TITLE_NOISE = {
  readLeadIn: /^.*(?:^|[-|–:]\s*)read\s+/i,
  mangaPrefix: /^manga:\s*/i,
  officialTag: /\[official\]|\(official\)/gi,
  leadingParenthetical: /^\s*\([^)]*\)/,
  season: /\(?\bs\d+\)?\s*$/i,
  volume: /\bvol(?:ume)?\.?\s*\d+\s*$/i,
  separators: /^[\s\-–—|:•·,(]+|[\s\-–—|:•·,(]+$/g,
  typeSuffixes: /(?:\s+(?:manga|manhwa|manhua|webtoon|comic|online))+$/i,
};

const TITLE_MENTION = new RegExp(
  `(?<![\\p{L}\\d])(?:${TITLE_CHAPTER_WORDS.join('|')})\\.?\\s*[-:]?\\s*(\\d+(?:[.,]\\d+)?)(?!\\d)|第\\s*(\\d+(?:\\.\\d+)?)\\s*[話话章回]|(\\d+)\\s*화`,
  'giu',
);
const URL_MENTION = new RegExp(
  `(?<![a-z\\d])(?:${URL_CHAPTER_WORDS.join('|')})(?:_?no)?[-_./=]?(\\d+)(?:[.\\-_](\\d+))?(?![\\da-z])`,
  'gi',
);

const isBoundary = (after: string): boolean => {
  const word = /^\s*([\p{L}]+)/u.exec(after);
  return !word || QUALIFIERS.includes(word[1].toLowerCase());
};

const chapterMentionIn = (pageTitle: string): ChapterMention | undefined => {
  for (const match of pageTitle.matchAll(TITLE_MENTION)) {
    const after = pageTitle.substring(match.index + match[0].length);
    const chapter = Chapter.parse(match[1] ?? match[2] ?? match[3]);
    if (chapter && isBoundary(after)) {
      return {
        chapter,
        before: pageTitle.substring(0, match.index),
        after,
      };
    }
  }
  return undefined;
};

const pathSegments = (url: string): string[] => url.split(/[/?#]/);

const urlChapters = (url: string): number[] => [
  ...[...url.matchAll(URL_MENTION)].flatMap(([, whole, decimal]) =>
    decimal ? [Number(whole), Number(`${whole}.${decimal}`)] : [Number(whole)],
  ),
  ...pathSegments(url)
    .filter((segment) => /^\d+$/.test(segment))
    .map(Number),
];

const mentionsAny = (
  page: VisitedPage,
  lexicon: readonly string[],
): boolean => {
  const text = `${page.pageTitle} ${page.url}`.toLowerCase();
  return lexicon.some((word) => text.includes(word));
};

const isChapterPage = (page: VisitedPage, mention: ChapterMention): boolean =>
  urlChapters(page.url).includes(mention.chapter.value) &&
  mentionsAny(page, READING_WORDS) &&
  !mentionsAny(page, OTHER_MEDIA_WORDS) &&
  !pathSegments(page.url).some((segment) =>
    NON_READING_PATHS.includes(segment.toLowerCase()),
  );

const compact = (text: string): string =>
  text.toLowerCase().replace(/[^\p{L}\d]/gu, '');

const hostOf = (url: string): string =>
  compact(url.replace(/^\w+:\/\/(www\.)?/, '').split('/')[0]);

const isWebsiteName = (segment: string, host: string): boolean => {
  const name = compact(segment);
  return (
    name.length > 0 &&
    (host.includes(name) ||
      segment
        .split(/\s+/)
        .some((word) => word.length >= 4 && host.includes(compact(word))))
  );
};

const cleaned = (text: string): string =>
  Object.values(TITLE_NOISE)
    .reduce((title, noise) => title.replace(noise, ''), text)
    .trim();

const titleBefore = (before: string): string => {
  const title = cleaned(before);
  return /^\d*$/.test(title) ? '' : title;
};

const withoutWebsiteName = (segments: string[], host: string): string[] =>
  segments.length > 1 && isWebsiteName(segments[segments.length - 1], host)
    ? segments.slice(0, -1)
    : segments;

const titleAmong = (segments: string[], host: string): string =>
  withoutWebsiteName(segments.map(cleaned).filter(Boolean), host)[0] ?? '';

const titleAfter = (after: string, host: string): string => {
  const [mentionSegment, ...nextSegments] = after.split('|');
  const nextTitle = titleAmong(nextSegments, host);
  return nextTitle && !isWebsiteName(nextTitle, host)
    ? nextTitle
    : titleAmong(mentionSegment.split(/\s[-–—•:]\s|\s+-\s+/), host);
};

const titleOf = (page: VisitedPage, mention: ChapterMention): string => {
  const before = titleBefore(mention.before);
  if (before) {
    return before;
  }
  const after = titleAfter(mention.after, hostOf(page.url));
  return compact(page.url).includes(compact(after)) ? after : '';
};

export const parseUnsupportedWebsitePage = (
  page: VisitedPage,
  readAt: Date,
): Reading | undefined => {
  const mention = chapterMentionIn(page.pageTitle);
  if (!mention || !isChapterPage(page, mention)) {
    return undefined;
  }
  const title = ScanTitle.parse(titleOf(page, mention));
  return title
    ? { title, chapter: mention.chapter, url: page.url, readAt }
    : undefined;
};
