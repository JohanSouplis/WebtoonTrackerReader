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
  readonly readingHint: string;
};

const LONG_TITLE_LENGTH = 45;

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
  const continueReading = `Continue reading Ch. ${scan.chapter}`;
  const row = {
    ...scan,
    website: websiteOf(scan.url),
    watch,
    readingHint:
      scan.title.length > LONG_TITLE_LENGTH
        ? `${scan.title} · ${continueReading}`
        : continueReading,
  };
  return rating === undefined ? row : { ...row, rating };
};
