import { WatchStatus } from '../../../../core/domain/chapter-watch';
import { ScanSnapshot } from '../../../../core/domain/scan-library';

export type PhoneHandoff = {
  readonly title: string;
  readonly chapterLabel: string;
  readonly url: string;
};

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
  readonly readOnOtherDevice: boolean;
  readonly handoff: PhoneHandoff;
};

const LONG_TITLE_LENGTH = 45;

const websiteOf = (url: string): string => {
  try {
    return new URL(url.includes('://') ? url : `http://${url}`).host;
  } catch {
    return url;
  }
};

const handoffOf = (
  { title, chapter, url }: ScanSnapshot,
  watch: WatchStatus,
): PhoneHandoff =>
  watch.kind === 'new'
    ? { title, chapterLabel: `New · Ch. ${watch.chapter}`, url: watch.url }
    : { title, chapterLabel: `Ch. ${chapter}`, url };

export const toScanRow = (
  snapshot: ScanSnapshot,
  watch: WatchStatus,
): ScanRow => {
  const { rating, origin, ...scan } = snapshot;
  const continueReading = `Continue reading Ch. ${scan.chapter}`;
  const row = {
    ...scan,
    website: websiteOf(scan.url),
    watch,
    readingHint:
      scan.title.length > LONG_TITLE_LENGTH
        ? `${scan.title} · ${continueReading}`
        : continueReading,
    readOnOtherDevice: origin === 'other-device',
    handoff: handoffOf(snapshot, watch),
  };
  return rating === undefined ? row : { ...row, rating };
};
