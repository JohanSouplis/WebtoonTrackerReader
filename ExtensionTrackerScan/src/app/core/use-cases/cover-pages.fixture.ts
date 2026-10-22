import { parsePageSignals } from '../../../page-signals-message';
import { CoverSource } from '../domain/cover';
import { PageSignals } from '../domain/parsed-page';
import { ImageSize } from '../gateways/in-memory/in-memory-web.gateway';
import coverPages from './cover-pages.fixture.json';

export type CoverPage = {
  readonly host: string;
  readonly seriesTitle: string;
  readonly page: PageSignals;
  readonly seriesPage?: PageSignals;
  readonly images: Readonly<Record<string, ImageSize>>;
  readonly expected?: {
    readonly from: CoverSource;
    readonly imageUrl: string;
  };
};

export const signalsOf = (message: unknown): PageSignals => {
  const signals = parsePageSignals(message);
  if (!signals) {
    throw new Error('The content script message does not parse');
  }
  return signals;
};

export const COVER_PAGES: readonly CoverPage[] = coverPages.map(
  ({ host, seriesTitle, page, seriesPage, images, expected }) => ({
    host,
    seriesTitle,
    page: signalsOf(page),
    seriesPage: seriesPage ? signalsOf(seriesPage) : undefined,
    images: Object.fromEntries(
      images.map(({ url, width, height }) => [url, { width, height }]),
    ),
    expected: expected
      ? {
          from: expected.from === 'page' ? 'page' : 'series-page',
          imageUrl: expected.imageUrl,
        }
      : undefined,
  }),
);
