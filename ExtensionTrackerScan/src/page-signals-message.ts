import {
  PageImage,
  PageLink,
  PageSignals,
  StructuredDataItem,
} from './app/core/domain/parsed-page';

export type StructuredDataNode = {
  readonly type: unknown;
  readonly name?: unknown;
  readonly headline?: unknown;
  readonly position?: unknown;
  readonly image?: unknown;
  readonly item?: unknown;
};

export type PageSignalsMessage = {
  readonly pageTitle: string;
  readonly url: string;
  readonly ogTitle?: string;
  readonly ogSiteName?: string;
  readonly canonicalUrl?: string;
  readonly heading?: string;
  readonly headings?: readonly string[];
  readonly breadcrumb?: string;
  readonly structuredData: readonly StructuredDataNode[];
  readonly selectedOptions?: readonly string[];
  readonly metaImages?: readonly string[];
  readonly images?: readonly PageImage[];
  readonly links?: readonly PageLink[];
};

const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  quot: '"',
  apos: "'",
  lt: '<',
  gt: '>',
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  laquo: '«',
  raquo: '»',
  middot: '·',
};

const decodeEntities = (text: string): string =>
  text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code[0] !== '#') {
      return NAMED_ENTITIES[code.toLowerCase()] ?? entity;
    }
    const codePoint =
      code[1].toLowerCase() === 'x'
        ? parseInt(code.substring(2), 16)
        : Number(code.substring(1));
    return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : entity;
  });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const textOf = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() !== ''
    ? value.replace(/\s+/g, ' ').trim()
    : undefined;

const decodedTextOf = (value: unknown): string | undefined => {
  const text = textOf(value);
  return text === undefined ? undefined : decodeEntities(text);
};

const listOf = (value: unknown): readonly unknown[] =>
  Array.isArray(value) ? value : [];

const positionOf = (value: unknown): number | undefined => {
  const position = typeof value === 'string' ? Number(value) : value;
  return typeof position === 'number' && Number.isFinite(position)
    ? position
    : undefined;
};

const linkedUrlOf = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    return linkedUrlOf(value[0]);
  }
  if (isRecord(value)) {
    return (
      textOf(value['url']) ??
      textOf(value['contentUrl']) ??
      textOf(value['@id'])
    );
  }
  return textOf(value);
};

const absoluteUrlOf = (value: unknown, pageUrl: string): string | undefined => {
  const url = linkedUrlOf(value);
  if (url === undefined) {
    return undefined;
  }
  try {
    return new URL(url, pageUrl).href;
  } catch {
    return undefined;
  }
};

const structuredDataItemOf =
  (pageUrl: string) =>
  (node: unknown): StructuredDataItem[] => {
    if (!isRecord(node)) {
      return [];
    }
    const types = Array.isArray(node['type']) ? node['type'] : [node['type']];
    return [
      {
        types: types.flatMap((type) => textOf(type) ?? []),
        name: decodedTextOf(node['name']),
        headline: decodedTextOf(node['headline']),
        position: positionOf(node['position']),
        image: absoluteUrlOf(node['image'], pageUrl),
        item: absoluteUrlOf(node['item'], pageUrl),
      },
    ];
  };

const pageImageOf =
  (pageUrl: string) =>
  (image: unknown): PageImage[] => {
    if (!isRecord(image)) {
      return [];
    }
    const src = absoluteUrlOf(image['src'], pageUrl);
    return src ? [{ src, alt: textOf(image['alt']) ?? '' }] : [];
  };

const pageLinkOf =
  (pageUrl: string) =>
  (link: unknown): PageLink[] => {
    if (!isRecord(link)) {
      return [];
    }
    const href = absoluteUrlOf(link['href'], pageUrl);
    const text = textOf(link['text']);
    return href && text
      ? [{ href, text, isBreadcrumb: link['isBreadcrumb'] === true }]
      : [];
  };

export const parsePageSignals = (message: unknown): PageSignals | undefined => {
  if (
    !isRecord(message) ||
    typeof message['pageTitle'] !== 'string' ||
    message['pageTitle'] === '' ||
    typeof message['url'] !== 'string'
  ) {
    return undefined;
  }
  const url = message['url'];
  return {
    pageTitle: message['pageTitle'],
    url,
    ogTitle: textOf(message['ogTitle']),
    ogSiteName: textOf(message['ogSiteName']),
    canonicalUrl: textOf(message['canonicalUrl']),
    heading: textOf(message['heading']),
    headings: listOf(message['headings']).flatMap(
      (heading) => textOf(heading) ?? [],
    ),
    breadcrumb: textOf(message['breadcrumb']),
    structuredData: listOf(message['structuredData']).flatMap(
      structuredDataItemOf(url),
    ),
    selectedOptions: listOf(message['selectedOptions']).flatMap(
      (option) => textOf(option) ?? [],
    ),
    metaImages: listOf(message['metaImages']).flatMap(
      (image) => absoluteUrlOf(image, url) ?? [],
    ),
    images: listOf(message['images']).flatMap(pageImageOf(url)),
    links: listOf(message['links']).flatMap(pageLinkOf(url)),
  };
};
