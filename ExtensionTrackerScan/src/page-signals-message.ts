import { PageSignals, StructuredDataItem } from './app/core/domain/parsed-page';

export type StructuredDataNode = {
  readonly type: unknown;
  readonly name: unknown;
  readonly headline: unknown;
  readonly position: unknown;
};

export type PageSignalsMessage = {
  readonly pageTitle: string;
  readonly url: string;
  readonly ogTitle?: string;
  readonly ogSiteName?: string;
  readonly canonicalUrl?: string;
  readonly heading?: string;
  readonly breadcrumb?: string;
  readonly structuredData: readonly StructuredDataNode[];
  readonly selectedOptions: readonly string[];
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

const structuredDataItemOf = (node: unknown): StructuredDataItem[] => {
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
    },
  ];
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
  return {
    pageTitle: message['pageTitle'],
    url: message['url'],
    ogTitle: textOf(message['ogTitle']),
    ogSiteName: textOf(message['ogSiteName']),
    canonicalUrl: textOf(message['canonicalUrl']),
    heading: textOf(message['heading']),
    breadcrumb: textOf(message['breadcrumb']),
    structuredData: listOf(message['structuredData']).flatMap(
      structuredDataItemOf,
    ),
    selectedOptions: listOf(message['selectedOptions']).flatMap(
      (option) => textOf(option) ?? [],
    ),
  };
};
