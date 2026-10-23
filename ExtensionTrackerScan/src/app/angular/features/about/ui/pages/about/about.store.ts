import { computed, Injectable, signal } from '@angular/core';
import {
  DEFAULT_REPORT_SETTINGS,
  ReportSettings,
} from '../../../../../../core/domain/report-settings';

@Injectable()
export class AboutStore {
  private readonly reportSettings = signal<ReportSettings>(
    DEFAULT_REPORT_SETTINGS,
  );
  readonly sendsParseReports = computed(
    () => this.reportSettings().sendsParseReports,
  );

  showReportSettings(settings: ReportSettings): void {
    this.reportSettings.set(settings);
  }
}
