import { siteOf } from './site';
import verifiedWebsites from './verified-websites.json';

export type VerifiedWebsite = {
  readonly host: string;
  readonly verifiedOn: string;
};

export const VERIFIED_WEBSITES: readonly VerifiedWebsite[] = verifiedWebsites;

export const isVerifiedWebsite = (url: string): boolean => {
  const site = siteOf(url);
  return VERIFIED_WEBSITES.some(({ host }) => host === site);
};
