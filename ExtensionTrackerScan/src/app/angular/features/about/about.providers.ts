import { inject, Provider } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { ChromeStorageReportSettingsRepository } from '../../../core/gateways/chrome-storage-report-settings-repository.gateway';
import { InMemoryReportSettingsRepository } from '../../../core/gateways/in-memory/in-memory-report-settings-repository.gateway';
import { ChangeParseReportsUseCase } from '../../../core/use-cases/change-parse-reports.use-case';
import { REPORT_SETTINGS_REPOSITORY } from '../../injection-tokens';

export const ABOUT_PROVIDERS: Provider[] = [
  {
    provide: REPORT_SETTINGS_REPOSITORY,
    useFactory: () =>
      environment.production
        ? new ChromeStorageReportSettingsRepository()
        : new InMemoryReportSettingsRepository(),
  },
  {
    provide: ChangeParseReportsUseCase,
    useFactory: () =>
      new ChangeParseReportsUseCase(inject(REPORT_SETTINGS_REPOSITORY)),
  },
];
