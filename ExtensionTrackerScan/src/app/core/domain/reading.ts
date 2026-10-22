import { Chapter } from './chapter';
import { ScanTitle } from './scan-title';

export type Reading = {
  readonly title: ScanTitle;
  readonly chapter: Chapter;
  readonly url: string;
  readonly readAt: Date;
};
