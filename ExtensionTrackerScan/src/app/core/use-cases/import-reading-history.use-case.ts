import { parsePage } from '../domain/page-title-parser';
import { BrowserHistoryPort } from '../ports/browser-history.port';
import { CrashReporterPort } from '../ports/crash-reporter.port';
import { ReportSettingsRepository } from '../ports/report-settings-repository.port';
import { ScanRepository } from '../ports/scan-repository.port';

export class ImportReadingHistoryUseCase {
  constructor(
    private readonly browserHistory: BrowserHistoryPort,
    private readonly scanRepository: ScanRepository,
    private readonly crashReporter: CrashReporterPort,
    private readonly reportSettings: ReportSettingsRepository,
  ) {}

  async execute(): Promise<void> {
    const visits = await this.browserHistory.findPagesVisitedSinceLastImport();
    const library = await this.scanRepository.load();
    const { sendsParseReports } = await this.reportSettings.load();
    for (const { page, readAt } of visits) {
      const parsedPage = parsePage(page, readAt);
      switch (parsedPage.kind) {
        case 'not-a-scan':
          break;
        case 'unparsed':
          if (sendsParseReports) {
            this.crashReporter.reportUnparsedPage(parsedPage.page);
          }
          break;
        case 'reading':
          library.recordReading(parsedPage.reading);
      }
    }
    await this.scanRepository.save(library);
  }
}
