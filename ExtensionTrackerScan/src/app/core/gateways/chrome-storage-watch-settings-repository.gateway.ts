import {
  CHECK_INTERVALS,
  DEFAULT_WATCH_SETTINGS,
  WatchSettings,
} from '../domain/chapter-watch';
import { WatchSettingsRepository } from '../ports/watch-settings-repository.port';

export const WATCH_SETTINGS_KEY = 'watch-settings';

export class ChromeStorageWatchSettingsRepository implements WatchSettingsRepository {
  async load(): Promise<WatchSettings> {
    const stored: unknown = (
      await chrome.storage.local.get([WATCH_SETTINGS_KEY])
    )[WATCH_SETTINGS_KEY];
    const checkEvery = CHECK_INTERVALS.find(
      (interval) =>
        typeof stored === 'object' &&
        stored !== null &&
        'checkEvery' in stored &&
        stored.checkEvery === interval,
    );
    return checkEvery ? { checkEvery } : DEFAULT_WATCH_SETTINGS;
  }

  async save(settings: WatchSettings): Promise<void> {
    await chrome.storage.local.set({ [WATCH_SETTINGS_KEY]: settings });
  }
}
