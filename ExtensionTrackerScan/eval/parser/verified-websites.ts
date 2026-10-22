import { VerifiedWebsite } from '../../src/app/core/domain/verified-websites';
import { WEBSITE_PATTERNS } from '../../src/app/core/domain/website-patterns';
import {
  CAPTURED_PAGES,
  CAPTURES,
  CapturedPage,
  messagesOf,
} from './captured-pages';
import { capturedOutcomeOf, recordedFromMessage } from './recorded';

export const VERIFIED_WEBSITES_PATH =
  'src/app/core/domain/verified-websites.json';

const DEAD_STATUSES = ['dead', 'redirected'];

const hostOf = (url: string): string =>
  new URL(url).hostname.replace(/^www\./, '');

const latestOf = (dates: readonly string[]): string =>
  dates.reduce((latest, date) => (date > latest ? date : latest));

const verifiedCapturedWebsites = (): VerifiedWebsite[] => {
  const pagesByHost = CAPTURED_PAGES.reduce((groups, page) => {
    const host = hostOf(page.capture.finalUrl);
    groups.set(host, [...(groups.get(host) ?? []), page]);
    return groups;
  }, new Map<string, CapturedPage[]>());
  return [...pagesByHost].flatMap(([host, pages]) => {
    const outcomes = pages.map((page) => ({
      capturedOn: page.capturedOn,
      outcome: capturedOutcomeOf(
        page.expected,
        messagesOf(page.capture).flatMap(recordedFromMessage),
      ),
    }));
    const exactDates = outcomes
      .filter(({ outcome }) => outcome === 'exact')
      .map(({ capturedOn }) => capturedOn);
    const hasWrongReading = outcomes.some(
      ({ outcome }) => outcome === 'wrong' || outcome === 'false-positive',
    );
    return exactDates.length > 0 && !hasWrongReading
      ? [{ host, verifiedOn: latestOf(exactDates) }]
      : [];
  });
};

const liveCatalogWebsites = (
  listed: readonly VerifiedWebsite[],
): VerifiedWebsite[] =>
  WEBSITE_PATTERNS.flatMap(({ host }) => {
    const captures = CAPTURES.filter(({ capture }) =>
      capture.host.includes(host),
    );
    const isListed = listed.some((website) => website.host.includes(host));
    const isDead = captures.some(({ capture }) =>
      DEAD_STATUSES.includes(capture.status),
    );
    return isListed || isDead || captures.length === 0
      ? []
      : [
          {
            host,
            verifiedOn: latestOf(captures.map(({ capturedOn }) => capturedOn)),
          },
        ];
  });

export const verifiedWebsites = (): VerifiedWebsite[] => {
  const captured = verifiedCapturedWebsites();
  return [...captured, ...liveCatalogWebsites(captured)].sort((a, b) =>
    a.host.localeCompare(b.host),
  );
};
