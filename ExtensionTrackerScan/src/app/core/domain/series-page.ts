import { withoutTitleNoise } from './page-lexicon';
import { PageSignals } from './parsed-page';
import { ScanTitle } from './scan-title';
import { SeriesKey } from './series-key';
import { siteOf } from './site';

type SeriesLink = {
  readonly href: string;
  readonly text: string;
};

const urlOf = (text: string): URL | undefined => {
  try {
    return new URL(text);
  } catch {
    return undefined;
  }
};

const withoutFragment = (url: string): string => url.split('#')[0];

const isInsideSite = (page: PageSignals, href: string): boolean => {
  const target = urlOf(href);
  return (
    target !== undefined &&
    /^https?:$/.test(target.protocol) &&
    siteOf(href) === siteOf(page.url) &&
    target.pathname !== '/' &&
    withoutFragment(href) !== withoutFragment(page.url)
  );
};

const linksOf = (page: PageSignals): SeriesLink[] => {
  const links = page.links ?? [];
  return [
    ...(page.structuredData ?? []).flatMap(({ types, name, item }) =>
      types.includes('ListItem') && name && item
        ? [{ href: item, text: name }]
        : [],
    ),
    ...links.filter(({ isBreadcrumb }) => isBreadcrumb),
    ...links.filter(({ isBreadcrumb }) => !isBreadcrumb),
  ];
};

export const seriesPageUrlOf = (
  page: PageSignals,
  title: ScanTitle,
): string | undefined =>
  linksOf(page).find(
    ({ href, text }) =>
      SeriesKey.of(withoutTitleNoise(text)).match(title.seriesKey) === 'same' &&
      isInsideSite(page, href),
  )?.href;
