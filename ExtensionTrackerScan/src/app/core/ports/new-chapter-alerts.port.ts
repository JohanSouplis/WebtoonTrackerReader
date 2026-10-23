import { NewChapter } from '../domain/chapter-watch';

export interface NewChapterAlertsPort {
  announce(chapters: readonly NewChapter[]): Promise<void>;
  showCount(count: number): Promise<void>;
}
