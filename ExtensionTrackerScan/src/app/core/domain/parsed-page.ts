import { Reading } from './reading';

export type VisitedPage = {
  readonly pageTitle: string;
  readonly url: string;
};

export type StructuredDataItem = {
  readonly types: readonly string[];
  readonly name?: string;
  readonly headline?: string;
  readonly position?: number;
};

export type PageSignals = VisitedPage & {
  readonly ogTitle?: string;
  readonly ogSiteName?: string;
  readonly canonicalUrl?: string;
  readonly heading?: string;
  readonly breadcrumb?: string;
  readonly structuredData?: readonly StructuredDataItem[];
  readonly selectedOptions?: readonly string[];
};

export type ParsedPage =
  | { readonly kind: 'reading'; readonly reading: Reading }
  | { readonly kind: 'not-a-scan' }
  | { readonly kind: 'unparsed'; readonly page: VisitedPage };
