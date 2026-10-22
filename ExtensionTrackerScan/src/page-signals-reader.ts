import { mayNameTheSeries } from './app/core/domain/cover-search';
import { PageImage, PageLink } from './app/core/domain/parsed-page';
import { isInsideSite } from './app/core/domain/series-page';
import { PageSignalsMessage, StructuredDataNode } from './page-signals-message';

const BREADCRUMB = 'nav[aria-label*="breadcrumb" i], [class*="breadcrumb" i]';
const BREADCRUMB_LINK = `${BREADCRUMB}, [itemtype*="BreadcrumbList"]`;
const META_IMAGES = ['og:image', 'twitter:image', 'twitter:image:src'];
const MAX_IMAGES = 10;
const MAX_LINKS = 50;

const structuredDataNodesIn = (value: unknown): StructuredDataNode[] => {
  if (Array.isArray(value)) {
    return value.flatMap(structuredDataNodesIn);
  }
  if (typeof value !== 'object' || value === null) {
    return [];
  }
  const nested = Object.values(value).flatMap(structuredDataNodesIn);
  return '@type' in value
    ? [
        {
          type: value['@type'],
          name: 'name' in value ? value.name : undefined,
          headline: 'headline' in value ? value.headline : undefined,
          position: 'position' in value ? value.position : undefined,
          image: 'image' in value ? value.image : undefined,
          item: 'item' in value ? value.item : undefined,
        },
        ...nested,
      ]
    : nested;
};

const parsedJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

const absoluteUrlOf = (href: string, pageUrl: string): string => {
  try {
    return new URL(href, pageUrl).href;
  } catch {
    return '';
  }
};

const firstOfEach = <T>(
  items: readonly T[],
  keyOf: (item: T) => string,
): T[] => {
  const firsts = new Map<string, T>();
  for (const item of items) {
    if (!firsts.has(keyOf(item))) {
      firsts.set(keyOf(item), item);
    }
  }
  return [...firsts.values()];
};

export const withCoverCandidatesOnly = (
  message: PageSignalsMessage,
): PageSignalsMessage => {
  const pageTexts = [
    message.pageTitle,
    message.ogTitle,
    message.heading,
    message.breadcrumb,
    ...message.structuredData.flatMap(({ name, headline }) => [name, headline]),
  ].filter((text): text is string => typeof text === 'string');
  const images = (message.images ?? []).filter(({ alt }) =>
    mayNameTheSeries(alt, pageTexts),
  );
  const links = (message.links ?? []).flatMap((link): PageLink[] => {
    const href = absoluteUrlOf(link.href, message.url);
    const text = link.text.replace(/\s+/g, ' ').trim();
    return text !== '' && isInsideSite(message.url, href)
      ? [{ href, text, isBreadcrumb: link.isBreadcrumb }]
      : [];
  });
  return {
    ...message,
    images: firstOfEach(images, ({ src, alt }) => `${src} ${alt}`).slice(
      0,
      MAX_IMAGES,
    ),
    links: firstOfEach(
      [
        ...links.filter(({ isBreadcrumb }) => isBreadcrumb),
        ...links.filter(({ isBreadcrumb }) => !isBreadcrumb),
      ],
      ({ href, text }) => `${href} ${text}`,
    ).slice(0, MAX_LINKS),
  };
};

export const readPageSignals = (
  page: Document,
  url: string,
): PageSignalsMessage => {
  const textOf = (selector: string): string | undefined =>
    page.querySelector<HTMLElement>(selector)?.innerText;
  const metaContent = (property: string): string | undefined =>
    page.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)
      ?.content;
  const attributeOf = (selector: string, attribute: string): string[] =>
    Array.from(
      page.querySelectorAll(selector),
      (element) => element.getAttribute(attribute) ?? [],
    ).flat();
  return withCoverCandidatesOnly({
    pageTitle: page.title,
    url,
    ogTitle: metaContent('og:title'),
    ogSiteName: metaContent('og:site_name'),
    canonicalUrl: page.querySelector<HTMLLinkElement>('link[rel="canonical"]')
      ?.href,
    heading: textOf('h1'),
    breadcrumb: textOf(BREADCRUMB),
    structuredData: Array.from(
      page.querySelectorAll('script[type="application/ld+json"]'),
      (script) => structuredDataNodesIn(parsedJson(script.textContent ?? '')),
    ).flat(),
    selectedOptions: Array.from(
      page.querySelectorAll('select option:checked'),
      (option) => option.textContent ?? '',
    ),
    metaImages: [
      ...META_IMAGES.flatMap((name) =>
        attributeOf(
          `meta[property="${name}"], meta[name="${name}"]`,
          'content',
        ),
      ),
      ...attributeOf('link[rel="image_src"]', 'href'),
    ],
    images: Array.from(
      page.querySelectorAll('img[alt]:not([alt=""])'),
      (image): PageImage => ({
        src:
          image.getAttribute('data-src') ??
          image.getAttribute('data-lazy-src') ??
          image.getAttribute('src') ??
          '',
        alt: image.getAttribute('alt') ?? '',
      }),
    ),
    links: Array.from(page.querySelectorAll('a[href]'), (link) => ({
      href: link.getAttribute('href') ?? '',
      text: link.textContent ?? '',
      isBreadcrumb: link.closest(BREADCRUMB_LINK) !== null,
    })),
  });
};
