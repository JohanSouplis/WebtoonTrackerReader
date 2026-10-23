import { LIBRARY_NOTIFICATION } from './app/core/gateways/chrome-new-chapter-alerts.gateway';
import { CheckNewChaptersUseCase } from './app/core/use-cases/check-new-chapters.use-case';
import { ShowNewChapterCountUseCase } from './app/core/use-cases/show-new-chapter-count.use-case';

export const CHECK_NEW_CHAPTERS_ALARM = 'check-new-chapters';

const CHECK_PERIOD_MINUTES = 30;

const openClickedNotification = (id: string): void => {
  void chrome.tabs.create({
    url: id === LIBRARY_NOTIFICATION ? chrome.runtime.getURL('index.html') : id,
  });
  void chrome.notifications.clear(id);
};

const listenToNotificationClicks = (): void => {
  if (
    chrome.notifications &&
    !chrome.notifications.onClicked.hasListener(openClickedNotification)
  ) {
    chrome.notifications.onClicked.addListener(openClickedNotification);
  }
};

const scheduleChecks = async (): Promise<void> => {
  if (!(await chrome.alarms.get(CHECK_NEW_CHAPTERS_ALARM))) {
    await chrome.alarms.create(CHECK_NEW_CHAPTERS_ALARM, {
      delayInMinutes: 1,
      periodInMinutes: CHECK_PERIOD_MINUTES,
    });
  }
};

export const watchNewChapters = (
  checkNewChapters: CheckNewChaptersUseCase,
  showNewChapterCount: ShowNewChapterCountUseCase,
): void => {
  let sweep: Promise<void> | undefined;
  chrome.alarms.onAlarm.addListener(({ name }) => {
    if (name === CHECK_NEW_CHAPTERS_ALARM) {
      sweep ??= checkNewChapters.execute().finally(() => {
        sweep = undefined;
        void scheduleChecks();
      });
    }
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && 'scans' in changes) {
      void showNewChapterCount.execute();
    }
  });
  chrome.permissions.onAdded.addListener(listenToNotificationClicks);
  listenToNotificationClicks();
  void scheduleChecks();
  void showNewChapterCount.execute();
};
