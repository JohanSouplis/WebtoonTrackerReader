import { WatchStatus } from '../../../../core/domain/chapter-watch';
import { ScanSnapshot } from '../../../../core/domain/scan-library';

export type ScanRow = {
  readonly title: string;
  readonly chapter: number;
  readonly url: string;
  readonly website: string;
  readonly readAt: Date;
  readonly isFavorite: boolean;
  readonly rating?: number;
  readonly watch: WatchStatus;
};

const websiteOf = (url: string): string => {
  try {
    return new URL(url.includes('://') ? url : `http://${url}`).host;
  } catch {
    return url;
  }
};

export const toScanRow = (
  { rating, ...scan }: ScanSnapshot,
  watch: WatchStatus,
): ScanRow => {
  const row = { ...scan, website: websiteOf(scan.url), watch };
  return rating === undefined ? row : { ...row, rating };
};
