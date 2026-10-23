import { ReportSettings } from '../domain/report-settings';
import { ReportSettingsRepository } from '../ports/report-settings-repository.port';

export class ChangeParseReportsUseCase {
  constructor(private readonly settingsRepository: ReportSettingsRepository) {}

  async execute(sendsParseReports: boolean): Promise<ReportSettings> {
    const settings: ReportSettings = { sendsParseReports };
    await this.settingsRepository.save(settings);
    return settings;
  }
}
