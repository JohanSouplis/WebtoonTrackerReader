import verifiedWebsites from './verified-websites.json';

export type VerifiedWebsite = {
  readonly host: string;
  readonly verifiedOn: string;
};

export const VERIFIED_WEBSITES: readonly VerifiedWebsite[] = verifiedWebsites;
