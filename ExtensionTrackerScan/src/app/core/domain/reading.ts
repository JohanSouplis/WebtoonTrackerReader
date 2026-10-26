import { Chapter } from './chapter';
import { ScanTitle } from './scan-title';

export type ReadingOrigin = 'this-device' | 'other-device' | 'unknown';

export type Reading = {
  readonly title: ScanTitle;
  readonly chapter: Chapter;
  readonly url: string;
  readonly readAt: Date;
  readonly origin: ReadingOrigin;
  readonly seriesUrl?: string;
};
