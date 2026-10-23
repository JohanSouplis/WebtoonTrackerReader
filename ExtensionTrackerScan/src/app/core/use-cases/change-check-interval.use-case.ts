import { CheckFrequency, WatchSettings } from '../domain/chapter-watch';
import { WatchSettingsRepository } from '../ports/watch-settings-repository.port';

export class ChangeCheckIntervalUseCase {
  constructor(private readonly settingsRepository: WatchSettingsRepository) {}

  async execute(checkEvery: CheckFrequency): Promise<WatchSettings> {
    const settings: WatchSettings = {
      ...(await this.settingsRepository.load()),
      checkEvery,
    };
    await this.settingsRepository.save(settings);
    return settings;
  }
}
