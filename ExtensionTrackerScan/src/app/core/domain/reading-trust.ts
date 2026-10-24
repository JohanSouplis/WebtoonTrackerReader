import { isCatalogPage } from './page-title-parser';
import { Reading } from './reading';
import { ScanLibrary } from './scan-library';
import { SeriesSuggestions } from './series-suggestions';
import { isVerifiedWebsite } from './verified-websites';

export type TrustReason =
  | 'tracked-series'
  | 'catalog-website'
  | 'verified-website'
  | 'learned-website';

export type ReadingTrust =
  | { readonly kind: 'trusted'; readonly reason: TrustReason }
  | { readonly kind: 'needs-confirmation' }
  | { readonly kind: 'ignored' };

const trustedBecause = (reason: TrustReason): ReadingTrust => ({
  kind: 'trusted',
  reason,
});

export const readingTrustOf = (
  reading: Reading,
  library: ScanLibrary,
  suggestions: SeriesSuggestions,
): ReadingTrust => {
  if (library.trackedTitleOf(reading.title)) {
    return trustedBecause('tracked-series');
  }
  if (isCatalogPage(reading.url)) {
    return trustedBecause('catalog-website');
  }
  if (isVerifiedWebsite(reading.url)) {
    return trustedBecause('verified-website');
  }
  switch (suggestions.standingOf(reading.url)) {
    case 'trusted':
      return trustedBecause('learned-website');
    case 'ignored':
      return { kind: 'ignored' };
    case 'learning':
      return { kind: 'needs-confirmation' };
  }
};
