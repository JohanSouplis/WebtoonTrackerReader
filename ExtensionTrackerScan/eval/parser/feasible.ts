import { PageSignalsMessage } from '../../src/page-signals-message';
import { CapturedPage, messagesOf } from './captured-pages';

const folded = (text: string): string =>
  text
    .normalize('NFKC')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');

const decoded = (url: string): string => {
  try {
    return decodeURIComponent(url);
  } catch {
    return url;
  }
};

const structuredTexts = ({ structuredData }: PageSignalsMessage): string[] =>
  structuredData.flatMap(({ name, headline }) =>
    [name, headline].flatMap((text) =>
      typeof text === 'string' ? [text] : [],
    ),
  );

const displayTexts = (message: PageSignalsMessage): string[] =>
  [
    message.pageTitle,
    message.ogTitle,
    message.heading,
    message.breadcrumb,
    ...structuredTexts(message),
    ...(message.selectedOptions ?? []),
    ...(message.headings ?? []),
    message.text,
  ].flatMap((text) => text ?? []);

const titleTexts = (message: PageSignalsMessage): string[] => [
  ...displayTexts(message),
  decoded(message.url),
  ...(message.canonicalUrl ? [decoded(message.canonicalUrl)] : []),
  ...(message.links ?? []).map(({ text }) => text),
  ...(message.images ?? []).map(({ alt }) => alt),
];

const numbersIn = (text: string): number[] =>
  [...text.normalize('NFKC').matchAll(/\d+(?:[.,]\d+)?/g)].map(([number]) =>
    Number(number.replace(',', '.')),
  );

export const isFeasible = ({ capture, expected }: CapturedPage): boolean => {
  if (expected.kind !== 'reading') {
    return false;
  }
  const messages = messagesOf(capture);
  const showsTitle = messages.some((message) =>
    titleTexts(message).some((text) =>
      expected.titles.some((title) => folded(text).includes(folded(title))),
    ),
  );
  const showsChapter = messages.some((message) =>
    displayTexts(message).some((text) =>
      numbersIn(text).some((number) => expected.chapters.includes(number)),
    ),
  );
  return showsTitle && showsChapter;
};
