import { ScanRow } from './scan-row.vm';

export type ScanPage = {
  readonly index: number;
  readonly size: number;
};

export type ScanListView =
  | { readonly kind: 'loading' }
  | { readonly kind: 'empty-library' }
  | { readonly kind: 'no-match'; readonly searchedTitle: string }
  | {
      readonly kind: 'scans';
      readonly rows: readonly ScanRow[];
      readonly page: ScanPage;
      readonly length: number;
    };
