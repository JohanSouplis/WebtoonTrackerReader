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
  readonly image?: string;
  readonly item?: string;
};

export type PageImage = {
  readonly src: string;
  readonly alt: string;
};

export type PageLink = {
  readonly href: string;
  readonly text: string;
  readonly isBreadcrumb: boolean;
};

export type PageSignals = VisitedPage & {
  readonly ogTitle?: string;
  readonly ogSiteName?: string;
  readonly canonicalUrl?: string;
  readonly heading?: string;
  readonly headings?: readonly string[];
  readonly breadcrumb?: string;
  readonly text?: string;
  readonly structuredData?: readonly StructuredDataItem[];
  readonly selectedOptions?: readonly string[];
  readonly metaImages?: readonly string[];
  readonly images?: readonly PageImage[];
  readonly links?: readonly PageLink[];
};

export type ParsedPage =
  | { readonly kind: 'reading'; readonly reading: Reading }
  | { readonly kind: 'not-a-scan' }
  | { readonly kind: 'unparsed'; readonly page: VisitedPage };
