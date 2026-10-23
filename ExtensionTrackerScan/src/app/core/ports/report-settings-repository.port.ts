import { ReportSettings } from '../domain/report-settings';

export interface ReportSettingsRepository {
  load(): Promise<ReportSettings>;
  save(settings: ReportSettings): Promise<void>;
}
