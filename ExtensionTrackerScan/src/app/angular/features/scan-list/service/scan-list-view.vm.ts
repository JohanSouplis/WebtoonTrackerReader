import { Cover } from '../../../../core/domain/cover';
import { ScanRow } from './scan-row.vm';

export type ScanPage = {
  readonly index: number;
  readonly size: number;
};

export type CoverTile =
  | { readonly kind: 'pending' }
  | { readonly kind: 'thumbnail'; readonly src: string }
  | { readonly kind: 'monogram' };

export type ShownScan = ScanRow & { readonly cover: CoverTile };

export type ScanListView =
  | { readonly kind: 'loading' }
  | { readonly kind: 'failed' }
  | { readonly kind: 'empty-library' }
  | { readonly kind: 'no-match'; readonly searchedTitle: string }
  | {
      readonly kind: 'scans';
      readonly rows: readonly ShownScan[];
      readonly page: ScanPage;
      readonly length: number;
    };

export const PENDING_COVER: CoverTile = { kind: 'pending' };

export const toCoverTile = (cover: Cover | undefined): CoverTile =>
  cover?.kind === 'found'
    ? { kind: 'thumbnail', src: cover.thumbnail.dataUrl }
    : { kind: 'monogram' };
