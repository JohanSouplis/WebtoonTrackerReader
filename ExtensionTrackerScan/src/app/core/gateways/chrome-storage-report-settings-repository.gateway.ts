import {
  DEFAULT_REPORT_SETTINGS,
  ReportSettings,
} from '../domain/report-settings';
import { ReportSettingsRepository } from '../ports/report-settings-repository.port';

const REPORT_SETTINGS_KEY = 'report-settings';

export class ChromeStorageReportSettingsRepository implements ReportSettingsRepository {
  async load(): Promise<ReportSettings> {
    const stored: unknown = (
      await chrome.storage.local.get([REPORT_SETTINGS_KEY])
    )[REPORT_SETTINGS_KEY];
    return typeof stored === 'object' &&
      stored !== null &&
      'sendsParseReports' in stored &&
      typeof stored.sendsParseReports === 'boolean'
      ? { sendsParseReports: stored.sendsParseReports }
      : DEFAULT_REPORT_SETTINGS;
  }

  async save(settings: ReportSettings): Promise<void> {
    await chrome.storage.local.set({ [REPORT_SETTINGS_KEY]: settings });
  }
}
