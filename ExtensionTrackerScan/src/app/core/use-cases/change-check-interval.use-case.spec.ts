import { InMemoryWatchSettingsRepository } from '../gateways/in-memory/in-memory-watch-settings-repository.gateway';
import { ChangeCheckIntervalUseCase } from './change-check-interval.use-case';

describe('ChangeCheckIntervalUseCase', () => {
  it('should keep the interval the reader chose', async () => {
    const settingsRepository = new InMemoryWatchSettingsRepository();

    const settings = await new ChangeCheckIntervalUseCase(
      settingsRepository,
    ).execute('24h');

    expect(settings).toEqual({ checkEvery: '24h' });
    expect(await settingsRepository.load()).toEqual({ checkEvery: '24h' });
  });
});
