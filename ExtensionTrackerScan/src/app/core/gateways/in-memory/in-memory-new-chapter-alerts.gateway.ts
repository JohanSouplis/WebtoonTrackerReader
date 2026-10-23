import { NewChapter } from '../../domain/chapter-watch';
import { NewChapterAlertsPort } from '../../ports/new-chapter-alerts.port';

export class InMemoryNewChapterAlerts implements NewChapterAlertsPort {
  readonly announcements: (readonly NewChapter[])[] = [];
  readonly counts: number[] = [];

  async announce(chapters: readonly NewChapter[]): Promise<void> {
    this.announcements.push(chapters);
  }

  async showCount(count: number): Promise<void> {
    this.counts.push(count);
  }
}
