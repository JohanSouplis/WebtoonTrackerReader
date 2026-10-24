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
  private readonly shownIgnoredSites = signal<readonly string[]>([]);
  readonly ignoredSites = this.shownIgnoredSites.asReadonly();

  showIgnoredSites(hosts: readonly string[]): void {
    this.shownIgnoredSites.set(hosts);
  }

  showReportSettings(settings: ReportSettings): void {
    this.reportSettings.set(settings);
  }
}
