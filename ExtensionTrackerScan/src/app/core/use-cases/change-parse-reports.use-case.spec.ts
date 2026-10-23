import { InMemoryReportSettingsRepository } from '../gateways/in-memory/in-memory-report-settings-repository.gateway';
import { ChangeParseReportsUseCase } from './change-parse-reports.use-case';

describe('ChangeParseReportsUseCase', () => {
  it('should keep parse reports off when the reader turns them off', async () => {
    const settingsRepository = new InMemoryReportSettingsRepository();

    const settings = await new ChangeParseReportsUseCase(
      settingsRepository,
    ).execute(false);

    expect(settings).toEqual({ sendsParseReports: false });
    expect(await settingsRepository.load()).toEqual({
      sendsParseReports: false,
    });
  });
});
