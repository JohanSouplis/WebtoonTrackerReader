import { WatchSettings } from '../domain/chapter-watch';

export interface WatchSettingsRepository {
  load(): Promise<WatchSettings>;
  save(settings: WatchSettings): Promise<void>;
}
