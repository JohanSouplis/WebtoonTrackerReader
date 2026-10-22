import { Chapter } from './chapter';
import { ParsedPage, VisitedPage } from './parsed-page';
import { Reading } from './reading';
import { ScanTitle } from './scan-title';
import { WEBSITE_PATTERNS, WebsitePattern } from './website-patterns';

const TITLE_MARKER = 't';
const CHAPTER_MARKER = 'c';
const HOST_PREFIX_LENGTH = 'https://'.length + 5;

type Extraction = { readonly title: string; readonly chapter?: Chapter };

const withoutLeadingSpace = (text: string): string =>
  text[0] === ' ' ? text.substring(1) : text;

const servesScans = (url: string, host: string): boolean =>
  url.substring(0, HOST_PREFIX_LENGTH + host.length).includes(host) &&
  url.length > HOST_PREFIX_LENGTH + host.length;

const isExcluded = (page: VisitedPage, pattern: WebsitePattern): boolean =>
  page.url.includes(String(pattern.excludedUrlPart)) ||
  page.pageTitle.includes(String(pattern.excludedTitlePart));

const titleAt = (text: string, segments: string[], index: number): string => {
  if (index === 0) {
    return text.split(segments[1])[0];
  }
  const rest = text.split(segments[index - 1])[1];
  return rest ? rest.split(segments[index + 1])[0] : '';
};

const chapterAt = (
  text: string,
  segments: string[],
  index: number,
): Chapter | undefined => {
  const rest = text.split(segments[index - 1])[1];
  return rest ? Chapter.parse(rest.split(' ')[0]) : undefined;
};

const extract = (
  format: string,
  text: string,
  previous: Extraction,
): Extraction => {
  const segments = format.split('§');
  return segments.reduce<Extraction>((extraction, segment, index) => {
    if (segment === TITLE_MARKER) {
      return { ...extraction, title: titleAt(text, segments, index) };
    }
    if (segment === CHAPTER_MARKER) {
      return { ...extraction, chapter: chapterAt(text, segments, index) };
    }
    return extraction;
  }, previous);
};

const readingFrom = (
  format: WebsitePattern['formats'][number],
  page: VisitedPage,
  readAt: Date,
): Reading | undefined => {
  const fromPageTitle = extract(format.pageTitle, page.pageTitle, {
    title: '',
  });
  const { title, chapter } = format.url
    ? extract(format.url, page.url, fromPageTitle)
    : fromPageTitle;
  const scanTitle = ScanTitle.parse(
    withoutLeadingSpace(title).replace(' [Official]', ''),
  );
  return scanTitle && chapter
    ? { title: scanTitle, chapter, url: page.url, readAt }
    : undefined;
};

export const parsePage = (page: VisitedPage, readAt: Date): ParsedPage => {
  const cleanedPage: VisitedPage = {
    pageTitle: withoutLeadingSpace(page.pageTitle.replace('\n', '')),
    url: page.url,
  };
  const pattern = WEBSITE_PATTERNS.find(({ host }) =>
    servesScans(page.url, host),
  );
  if (!pattern || isExcluded(cleanedPage, pattern)) {
    return { kind: 'not-a-scan' };
  }
  for (const format of pattern.formats) {
    const reading = readingFrom(format, cleanedPage, readAt);
    if (reading) {
      return { kind: 'reading', reading };
    }
  }
  return { kind: 'unparsed', page: cleanedPage };
};
