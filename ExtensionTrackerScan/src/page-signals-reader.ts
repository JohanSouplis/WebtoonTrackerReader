import { PageSignalsMessage, StructuredDataNode } from './page-signals-message';

const BREADCRUMB = 'nav[aria-label*="breadcrumb" i], [class*="breadcrumb" i]';
const BREADCRUMB_LINK = `${BREADCRUMB}, [itemtype*="BreadcrumbList"]`;
const META_IMAGES = ['og:image', 'twitter:image', 'twitter:image:src'];

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
  return {
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
      (image) => ({
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
  };
};
