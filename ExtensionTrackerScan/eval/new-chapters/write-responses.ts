import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';
import { parsePage } from '../../src/app/core/domain/page-title-parser';
import { seriesPageUrlOf } from '../../src/app/core/domain/series-page';
import { parsePageSignals } from '../../src/page-signals-message';
import { readPageSignals } from '../../src/page-signals-reader';
import {
  CHAPTER_WORDS,
  URL_CHAPTER_WORDS,
} from '../../src/app/core/domain/page-lexicon';
import {
  Corpus,
  NewChapterCase,
  RecordedPage,
  replay,
  Responses,
  StoredPage,
} from './replay';

type CachedResponse = {
  readonly url: string;
  readonly tag: string;
  readonly status: number | null;
  readonly finalUrl?: string;
  readonly body: string;
};

type InvestigatedHost = {
  readonly host: string;
  readonly block?: string;
  readonly N?: number;
  readonly truth?: boolean | null;
  readonly src?: string;
  readonly s2_url?: string | null;
};

type FeedTarget = readonly [host: string, seriesUrl: string, feedUrl: string];

const [sitesDir, feedsDir, output] = process.argv.slice(2);

const cachedResponses = (directory: string): CachedResponse[] =>
  readdirSync(directory)
    .filter((file) => file.endsWith('.json'))
    .map((file) => ({
      ...JSON.parse(readFileSync(join(directory, file), 'utf8')),
      body: readFileSync(
        join(directory, file.replace(/\.json$/, '.html')),
        'utf8',
      ),
    }));

const recordedOf = (response: CachedResponse): RecordedPage | 'unreachable' =>
  response.status === null
    ? 'unreachable'
    : {
        status: response.status,
        url: response.finalUrl ?? response.url,
        text: response.body,
      };

const tagOf = new WeakMap<RecordedPage, string>();

const indexed = (
  responses: readonly CachedResponse[],
): Map<string, RecordedPage | 'unreachable'> => {
  const pages = new Map<string, RecordedPage | 'unreachable'>();
  responses.forEach((response) => {
    if (!pages.has(response.url)) {
      const page = recordedOf(response);
      if (page !== 'unreachable') {
        tagOf.set(page, response.tag);
      }
      pages.set(response.url, page);
    }
  });
  return pages;
};

const MAY_NAME_A_CHAPTER_OR_PAGE = new RegExp(
  `(?<![a-z])(?:${[...CHAPTER_WORDS, ...URL_CHAPTER_WORDS, 'page'].join('|')})[^\\d<]{0,12}\\d`,
  'u',
);

const escapedText = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const quiet = new VirtualConsole();

const scratch = new JSDOM('<p></p>', { virtualConsole: quiet }).window.document
  .body;

const plain = (html: string): string => {
  scratch.innerHTML = html;
  return scratch.textContent ?? '';
};

const isOnHost = (href: string, pageUrl: string): boolean => {
  try {
    return (
      new URL(href.replace(/&amp;/g, '&'), pageUrl).host ===
      new URL(pageUrl).host
    );
  } catch {
    return false;
  }
};

const reducedText = (text: string, pageUrl: string): string => {
  const head = [
    /<title\b[^>]*>[\s\S]*?<\/title>/i.exec(text)?.[0] ?? '',
    /<meta\b[^>]*property=["']og:title["'][^>]*>/i.exec(text)?.[0] ?? '',
    /<h1\b[^>]*>[\s\S]*?<\/h1>/i.exec(text)?.[0] ?? '',
  ];
  const isFeedText = /<rss\b|<feed\b/i.test(text.slice(0, 3000));
  const items = isFeedText
    ? [...text.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map(
        ([, tag, item]) =>
          `<${tag}>${/<title\b[^>]*>[\s\S]*?<\/title>/i.exec(item)?.[0] ?? ''}${
            /<link\b[^>]*>[\s\S]*?<\/link>|<link\b[^>]*\/?>/i.exec(item)?.[0] ??
            ''
          }</${tag}>`,
      )
    : [];
  const anchors = [
    ...text.matchAll(
      /<a\b[^>]*?\bhref\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi,
    ),
  ]
    .filter(
      ([, , href, inner]) =>
        MAY_NAME_A_CHAPTER_OR_PAGE.test(`${href} ${inner}`.toLowerCase()) &&
        isOnHost(href, pageUrl),
    )
    .map(
      ([, quote, href, inner]) =>
        `<a href=${quote}${href.replace(/^(?:https?:)?\/\/[^/?#]+(?=[/?#]|$)/i, '') || '/'}${quote}>${escapedText(
          plain(inner.replace(/<[^>]*>/g, ' '))
            .replace(/\s+/g, ' ')
            .trim(),
        )}</a>`,
    );
  return [
    isFeedText ? '<rss>' : '',
    ...head,
    ...items,
    ...anchors,
    isFeedText ? '</rss>' : '',
  ].join('\n');
};

const CHAPTER_PAGE_TAGS = ['ch', 'inc', 'neg'];

const headingsOnly = (text: string): string =>
  [
    /<title\b[^>]*>[\s\S]*?<\/title>/i.exec(text)?.[0] ?? '',
    /<meta\b[^>]*property=["']og:title["'][^>]*>/i.exec(text)?.[0] ?? '',
    /<h1\b[^>]*>[\s\S]*?<\/h1>/i.exec(text)?.[0] ?? '',
  ].join('\n');

const reduced = (
  page: RecordedPage | 'unreachable',
): RecordedPage | 'unreachable' => {
  if (page === 'unreachable') {
    return page;
  }
  return {
    ...page,
    text: CHAPTER_PAGE_TAGS.includes(tagOf.get(page) ?? '')
      ? headingsOnly(page.text)
      : reducedText(page.text, page.url),
  };
};

const extensionSeriesUrlOf = (page: RecordedPage): string | undefined => {
  const { window } = new JSDOM(page.text, {
    url: page.url,
    virtualConsole: quiet,
  });
  const signals = parsePageSignals(readPageSignals(window.document, page.url));
  window.close();
  if (!signals) {
    return undefined;
  }
  const parsed = parsePage(signals, new Date(), 'unknown');
  return parsed.kind === 'reading'
    ? seriesPageUrlOf(signals, parsed.reading.title)
    : undefined;
};

const withoutSlash = (url: string): string => url.replace(/\/+$/, '');

const sitePages = indexed(cachedResponses(join(sitesDir, 'cache2')));
const chapterResponses = cachedResponses(join(sitesDir, 'cache2')).filter(
  ({ tag }) => tag === 'ch',
);
const investigated: InvestigatedHost[] = JSON.parse(
  readFileSync(join(sitesDir, 'final.json'), 'utf8'),
);
const seriesUrlAgreement = { same: 0, different: 0, none: 0 };
const siteCases: NewChapterCase[] = investigated.flatMap((host) => {
  const chapterPage = chapterResponses.find(
    ({ url }) => new URL(url).host === host.host,
  );
  if (
    host.block ||
    host.truth === null ||
    host.truth === undefined ||
    host.N === undefined ||
    !chapterPage ||
    !host.src
  ) {
    return [];
  }
  const recorded = recordedOf(chapterPage);
  const seriesUrl =
    recorded === 'unreachable' ? undefined : extensionSeriesUrlOf(recorded);
  if (!seriesUrl) {
    seriesUrlAgreement.none += 1;
  } else if (
    host.s2_url &&
    withoutSlash(seriesUrl) === withoutSlash(host.s2_url)
  ) {
    seriesUrlAgreement.same += 1;
  } else {
    seriesUrlAgreement.different += 1;
  }
  return [
    {
      corpus: 'series pages',
      host: host.host,
      chapter: host.N,
      url: chapterPage.url,
      seriesUrl:
        seriesUrl &&
        host.s2_url &&
        withoutSlash(seriesUrl) === withoutSlash(host.s2_url)
          ? host.s2_url
          : seriesUrl,
      truth: host.truth ? 'new' : 'none',
      truthFrom: host.src,
    },
  ];
});

const feedPages = indexed(cachedResponses(join(feedsDir, 'cache')));
const feedTargets: FeedTarget[] = JSON.parse(
  readFileSync(join(feedsDir, 'targets.json'), 'utf8'),
);
const seriesTruth: Record<string, number | null> = JSON.parse(
  readFileSync(join(feedsDir, 'truth.json'), 'utf8'),
);
const feedCases: NewChapterCase[] = feedTargets.flatMap(([host, seriesUrl]) => {
  const latest = seriesTruth[seriesUrl];
  if (latest === null || latest === undefined || latest < 1) {
    return [];
  }
  const testCase = {
    corpus: 'feeds' as const,
    host,
    url: seriesUrl,
    seriesUrl,
    truthFrom: 'series page read by the investigation parser',
  };
  return [
    { ...testCase, chapter: latest - 1, truth: 'new' as const },
    { ...testCase, chapter: latest, truth: 'none' as const },
  ];
});

const cases = [...siteCases, ...feedCases];
const pagesOf = (corpus: Corpus) =>
  corpus === 'feeds' ? feedPages : sitePages;
const kept: Record<Corpus, Record<string, StoredPage | 'unreachable'>> = {
  'series pages': {},
  feeds: {},
};
const texts: string[] = [];
const stored = (
  page: RecordedPage | 'unreachable',
): StoredPage | 'unreachable' => {
  if (page === 'unreachable') {
    return page;
  }
  const known = texts.indexOf(page.text);
  if (known === -1) {
    texts.push(page.text);
  }
  return { ...page, text: known === -1 ? texts.length - 1 : known };
};
const disagreements = cases.flatMap((testCase) => {
  const pages = pagesOf(testCase.corpus);
  const raw = replay(testCase, (url) => pages.get(url));
  const fromReduced = replay(testCase, (url) => {
    const page = pages.get(url);
    return page && reduced(page);
  });
  [
    ...raw.requests,
    ...[...pages.entries()].flatMap(([url, page]) =>
      new URL(url).host === new URL(testCase.url).host &&
      (url === testCase.seriesUrl ||
        (page !== 'unreachable' &&
          CHAPTER_PAGE_TAGS.includes(tagOf.get(page) ?? '')))
        ? [url]
        : [],
    ),
  ].forEach((url) => {
    const page = pages.get(url);
    if (page) {
      kept[testCase.corpus][url] = stored(reduced(page));
    }
  });
  return JSON.stringify(raw) === JSON.stringify(fromReduced)
    ? []
    : [{ testCase, raw, fromReduced }];
});
if (disagreements.length > 0) {
  console.error(JSON.stringify(disagreements, null, 1));
  throw new Error(
    `${disagreements.length} cases read differently once reduced`,
  );
}
const responses: Responses = { cases, pages: kept, texts };
writeFileSync(output, `${JSON.stringify(responses)}\n`);
console.log(
  `cases ${cases.length} (series pages ${siteCases.length}, feeds ${feedCases.length}), pages ${Object.keys(kept['series pages']).length + Object.keys(kept.feeds).length}`,
);
console.log(
  `series url found by the extension vs the investigation: ${JSON.stringify(seriesUrlAgreement)}`,
);
