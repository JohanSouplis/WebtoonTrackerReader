import {
  DEFAULT_WATCH_SETTINGS,
  WatchSettings,
} from '../../domain/chapter-watch';
import { WatchSettingsRepository } from '../../ports/watch-settings-repository.port';

export class InMemoryWatchSettingsRepository implements WatchSettingsRepository {
  constructor(private settings: WatchSettings = DEFAULT_WATCH_SETTINGS) {}

  async load(): Promise<WatchSettings> {
    return this.settings;
  }

  async save(settings: WatchSettings): Promise<void> {
    this.settings = settings;
  }
}
