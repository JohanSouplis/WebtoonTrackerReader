import { siteOf } from '../../../../core/domain/site';

export type ProposalStatus =
  | 'idle'
  | 'sending'
  | 'sent'
  | 'already-supported'
  | 'failed';

export const isChapterUrl = (text: string): boolean => {
  try {
    const url = new URL(text.trim());
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      url.hostname.includes('.')
    );
  } catch {
    return false;
  }
};

const siteOfTyped = (text: string): string | undefined =>
  text.includes('/')
    ? siteOf(text.includes('://') ? text : `https://${text}`)
    : undefined;

export const matchWebsites = (
  websites: readonly string[],
  query: string,
): readonly string[] => {
  const text = query.trim().toLowerCase();
  const site = siteOfTyped(text);
  return websites.filter((website) =>
    site ? website === site : website.toLowerCase().includes(text),
  );
};
