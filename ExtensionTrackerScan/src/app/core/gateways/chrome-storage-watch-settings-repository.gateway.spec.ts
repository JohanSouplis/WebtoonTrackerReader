import { ChromeStorageWatchSettingsRepository } from './chrome-storage-watch-settings-repository.gateway';
import { FakeChromeStorage, installChrome } from './fake-chrome.fixture';

describe('ChromeStorageWatchSettingsRepository', () => {
  it.each`
    stored
    ${undefined}
    ${{ checkEvery: '5m' }}
  `(
    'should check every 6 hours when no interval it can read is stored: $stored',
    async ({ stored }) => {
      installChrome({
        storage: { local: new FakeChromeStorage({ 'watch-settings': stored }) },
      });

      expect(await new ChromeStorageWatchSettingsRepository().load()).toEqual({
        checkEvery: '6h',
      });
    },
  );

  it('should keep the interval the reader chose', async () => {
    installChrome({ storage: { local: new FakeChromeStorage() } });
    const repository = new ChromeStorageWatchSettingsRepository();

    await repository.save({ checkEvery: '1h' });

    expect(await repository.load()).toEqual({ checkEvery: '1h' });
  });
});
