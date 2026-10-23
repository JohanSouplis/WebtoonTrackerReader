import { ChromeStorageReportSettingsRepository } from './chrome-storage-report-settings-repository.gateway';
import { FakeChromeStorage, installChrome } from './fake-chrome.fixture';

describe('ChromeStorageReportSettingsRepository', () => {
  it.each`
    stored
    ${undefined}
    ${{ sendsParseReports: 'no' }}
  `(
    'should send parse reports when no choice it can read is stored: $stored',
    async ({ stored }) => {
      installChrome({
        storage: {
          local: new FakeChromeStorage({ 'report-settings': stored }),
        },
      });

      expect(await new ChromeStorageReportSettingsRepository().load()).toEqual({
        sendsParseReports: true,
      });
    },
  );

  it('should keep the reports turned off when the reader turns them off', async () => {
    installChrome({ storage: { local: new FakeChromeStorage() } });
    const repository = new ChromeStorageReportSettingsRepository();

    await repository.save({ sendsParseReports: false });

    expect(await repository.load()).toEqual({ sendsParseReports: false });
  });
});
