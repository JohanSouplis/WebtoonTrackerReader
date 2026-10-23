import { CHAPTER_WORDS, URL_CHAPTER_WORDS } from './page-lexicon';

export type FetchedPage =
  | {
      readonly kind: 'page';
      readonly status: number;
      readonly url: string;
      readonly text: string;
    }
  | { readonly kind: 'unreachable' };

export type ListedChapter = {
  readonly chapter: number;
  readonly url: string;
};

export type PageAnswer =
  | 'ok'
  | 'missing'
  | 'blocked'
  | 'server-error'
  | 'unreachable';

const HIGHEST_CHAPTER = 20000;

const BOT_CHECK_TITLES = /just a moment|attention required|un instant/i;

const NOT_FOUND_TITLES =
  /404|not found|introuvable|no encontrad|não encontrad|tidak ditemukan|bulunamad|page not|error/i;

const ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

const escaped = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const alternativesOf = (words: readonly string[]): string =>
  [...words]
    .sort((a, b) => b.length - a.length)
    .map(escaped)
    .join('|');

const NUMBER = '(\\d+(?:\\.\\d+)?)';

const TEXT_CHAPTER = new RegExp(
  `(?<!\\p{L})(?:${alternativesOf(CHAPTER_WORDS)})\\.?\\s*[:#]?\\s*${NUMBER}(?!\\d)`,
  'iu',
);

const PATH_CHAPTER = new RegExp(
  `(?<![a-z])(?:${alternativesOf(URL_CHAPTER_WORDS)})[-_/.]?${NUMBER}(?:[-_/]|$)`,
  'i',
);

const decoded = (text: string): string =>
  text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([\da-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&([a-z]+);/gi, (entity, name: string) => {
      const character = ENTITIES[name.toLowerCase()];
      return character ?? entity;
    });

const plainText = (html: string): string =>
  decoded(html.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();

const urlOf = (href: string, base: string): URL | undefined => {
  try {
    return new URL(decoded(href.trim()), base);
  } catch {
    return undefined;
  }
};

const chapterIn = (text: string, pattern: RegExp): number | undefined => {
  const value = Number(pattern.exec(text)?.[1]);
  return Number.isNaN(value) || value >= HIGHEST_CHAPTER ? undefined : value;
};

export const chapterMentionedIn = (text: string): number | undefined =>
  chapterIn(text, TEXT_CHAPTER);

export const answerOf = (page: FetchedPage): PageAnswer => {
  if (page.kind === 'unreachable') {
    return 'unreachable';
  }
  if (
    [403, 429, 503].includes(page.status) ||
    BOT_CHECK_TITLES.test(titleOf(page.text))
  ) {
    return 'blocked';
  }
  if ([404, 410].includes(page.status)) {
    return 'missing';
  }
  return page.status >= 400 ? 'server-error' : 'ok';
};

const titleOf = (html: string): string =>
  plainText(/<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '');

export const headingsOf = (html: string): string =>
  [
    titleOf(html),
    /<meta\b[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i.exec(
      html,
    )?.[1] ?? '',
    plainText(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1] ?? ''),
  ]
    .map(decoded)
    .join(' ');

export const isNotFoundPage = (html: string): boolean =>
  NOT_FOUND_TITLES.test(titleOf(html));

export const showsChapter = (text: string, chapter: number): boolean =>
  new RegExp(`(?<!\\d)(?<!\\d\\.)0*${escaped(String(chapter))}(?!\\d)`).test(
    text,
  );

const anchorsOf = (
  html: string,
  base: string,
): { readonly url: URL; readonly text: string }[] =>
  [
    ...html.matchAll(
      /<a\b[^>]*?\bhref\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi,
    ),
  ].flatMap(([, , href, inner]) => {
    const url = urlOf(href, base);
    return url ? [{ url, text: plainText(inner) }] : [];
  });

const lastSegmentOf = (path: string): string =>
  path.split('/').filter(Boolean).pop() ?? '';

const withoutTrailingSlash = (path: string): string => path.replace(/\/+$/, '');

const SLUG_THEN_CHAPTER = new RegExp(
  `^[-_/]*(?:${alternativesOf(URL_CHAPTER_WORDS)})[-_/.]?\\d`,
  'i',
);

const isChapterOfSlug = (url: URL, slug: string): boolean => {
  const path = url.pathname.toLowerCase();
  const index = path.indexOf(slug);
  return (
    slug.length >= 4 &&
    index > 0 &&
    path[index - 1] === '/' &&
    SLUG_THEN_CHAPTER.test(path.slice(index + slug.length))
  );
};

export const chaptersListedOn = (
  page: { readonly url: string; readonly text: string },
  seriesUrl: string,
): ListedChapter[] => {
  const series = new URL(seriesUrl);
  const seriesPath = withoutTrailingSlash(series.pathname);
  const slug = lastSegmentOf(seriesPath).toLowerCase();
  return anchorsOf(page.text, page.url).flatMap(({ url, text }) => {
    const isSeriesLink =
      url.hostname === series.hostname &&
      (url.pathname.startsWith(`${seriesPath}/`) || isChapterOfSlug(url, slug));
    const chapter = isSeriesLink
      ? (chapterIn(text, TEXT_CHAPTER) ?? chapterIn(url.pathname, PATH_CHAPTER))
      : undefined;
    return chapter === undefined ? [] : [{ chapter, url: url.href }];
  });
};

const addressOf = (url: string): string =>
  withoutTrailingSlash(url.replace(/#.*$/, '')).toLowerCase();

export const isRenumbered = (listed: readonly ListedChapter[]): boolean => {
  const addresses = new Map<number, string>();
  return listed.some(({ chapter, url }) => {
    const address = addressOf(url);
    const known = addresses.get(chapter);
    addresses.set(chapter, address);
    return known !== undefined && known !== address;
  });
};

export const lastListPageOf = (page: {
  readonly url: string;
  readonly text: string;
}): string | undefined => {
  const pages = anchorsOf(page.text, page.url).flatMap(({ url }) => {
    const number = /(?:[?&]page=|\/page\/)(\d+)/.exec(url.href)?.[1];
    return number ? [{ number: Number(number), url: url.href }] : [];
  });
  const last = pages.reduce<{ number: number; url: string } | undefined>(
    (highest, page) =>
      highest === undefined || page.number > highest.number ? page : highest,
    undefined,
  );
  return last && last.number > 1 ? last.url : undefined;
};

const tagText = (xml: string, tag: string): string =>
  decoded(
    new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'i').exec(xml)?.[1] ??
      '',
  ).trim();

export const isFeed = (text: string): boolean =>
  /<rss\b|<feed\b/i.test(text.slice(0, 3000));

export const chaptersInFeed = (
  page: { readonly url: string; readonly text: string },
  isOfSeries: (url: URL) => boolean,
): ListedChapter[] =>
  [...page.text.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi)].flatMap(
    ([, , item]) => {
      const chapter = chapterMentionedIn(plainText(tagText(item, 'title')));
      const link =
        tagText(item, 'link') ||
        /<link\b[^>]*href=["']([^"']*)["']/i.exec(item)?.[1] ||
        '';
      const url = urlOf(link, page.url);
      return chapter === undefined || !url || !isOfSeries(url)
        ? []
        : [{ chapter, url: url.href }];
    },
  );
