import { Reading } from './reading';

export type VisitedPage = {
  readonly pageTitle: string;
  readonly url: string;
};

export type ParsedPage =
  | { readonly kind: 'reading'; readonly reading: Reading }
  | { readonly kind: 'not-a-scan' }
  | { readonly kind: 'unparsed'; readonly page: VisitedPage };
