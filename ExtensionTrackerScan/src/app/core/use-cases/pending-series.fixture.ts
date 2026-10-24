import { VisitedPage } from '../domain/parsed-page';
import {
  HostTrustSnapshot,
  PendingSeriesSnapshot,
  SeriesSuggestionsSnapshot,
} from '../domain/series-suggestions';

export const UNCERTAIN_HOST = 'mangareader.example';

export const OTHER_UNCERTAIN_HOST = 'readmanga.example';

const slugOf = (title: string): string =>
  title.toLowerCase().replace(/[^a-z\d]+/g, '-');

export const uncertainUrl = (
  slug: string,
  chapter: number,
  host = UNCERTAIN_HOST,
): string => `https://${host}/${slug}/chapter-${chapter}`;

export const uncertainPage = (
  title: string,
  chapter: number,
  host = UNCERTAIN_HOST,
): VisitedPage => ({
  pageTitle: `${title} Chapter ${chapter} - Manga Reader`,
  url: uncertainUrl(slugOf(title), chapter, host),
});

export const VERIFIED_SITE_PAGE: VisitedPage = {
  pageTitle: 'Nano Machine - Chapter 190 - Flame Comics',
  url: 'https://flamecomics.xyz/nano-machine-chapter-190/',
};

export const pendingSeries = (
  series: Partial<PendingSeriesSnapshot> & { readonly title: string },
): PendingSeriesSnapshot => ({
  chapter: 1,
  url: uncertainUrl(slugOf(series.title), series.chapter ?? 1, series.host),
  host: UNCERTAIN_HOST,
  seenAt: new Date('2024-12-01T10:00:00Z'),
  source: 'page',
  ...series,
});

export const hostTrust = (
  trust: Partial<HostTrustSnapshot>,
): HostTrustSnapshot => ({
  host: UNCERTAIN_HOST,
  confirmedInARow: 0,
  dismissedInARow: 0,
  dismissedTitles: [],
  ...trust,
});

export const waiting = (
  pending: readonly PendingSeriesSnapshot[],
  hosts: readonly HostTrustSnapshot[] = [],
): SeriesSuggestionsSnapshot => ({ pending, hosts });
