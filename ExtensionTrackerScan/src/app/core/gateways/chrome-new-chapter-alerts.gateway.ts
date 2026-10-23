import { NewChapter } from '../domain/chapter-watch';
import { NewChapterAlertsPort } from '../ports/new-chapter-alerts.port';

export const LIBRARY_NOTIFICATION = 'new-chapters';

const BADGE_COLOR = '#9b8cff';

const ICON = 'public/icone.png';

const notificationOf = (
  chapters: readonly NewChapter[],
): { id: string; title: string; message: string } => {
  const [first] = chapters;
  return chapters.length === 1
    ? {
        id: first.url,
        title: first.title,
        message: `Chapter ${first.chapter} is out`,
      }
    : {
        id: LIBRARY_NOTIFICATION,
        title: `${chapters.length} new chapters`,
        message: chapters
          .map(({ title, chapter }) => `${title}: chapter ${chapter}`)
          .join('\n'),
      };
};

export class ChromeNewChapterAlerts implements NewChapterAlertsPort {
  async announce(chapters: readonly NewChapter[]): Promise<void> {
    if (
      !(await chrome.permissions.contains({ permissions: ['notifications'] }))
    ) {
      return;
    }
    const { id, title, message } = notificationOf(chapters);
    await chrome.notifications.create(id, {
      type: 'basic',
      iconUrl: ICON,
      title,
      message,
    });
  }

  async showCount(count: number): Promise<void> {
    await chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR });
    await chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
  }
}
