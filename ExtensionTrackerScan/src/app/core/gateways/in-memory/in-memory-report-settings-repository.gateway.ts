import {
  DEFAULT_REPORT_SETTINGS,
  ReportSettings,
} from '../../domain/report-settings';
import { ReportSettingsRepository } from '../../ports/report-settings-repository.port';

export class InMemoryReportSettingsRepository implements ReportSettingsRepository {
  constructor(private settings: ReportSettings = DEFAULT_REPORT_SETTINGS) {}

  async load(): Promise<ReportSettings> {
    return this.settings;
  }

  async save(settings: ReportSettings): Promise<void> {
    this.settings = settings;
  }
}
