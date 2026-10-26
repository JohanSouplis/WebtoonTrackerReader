import { parsePage } from '../domain/page-title-parser';
import { readingTrustOf } from '../domain/reading-trust';
import { parseMissEvent } from '../domain/telemetry';
import { BrowserHistoryPort } from '../ports/browser-history.port';
import { CrashReporterPort } from '../ports/crash-reporter.port';
import { ReportSettingsRepository } from '../ports/report-settings-repository.port';
import { ScanRepository } from '../ports/scan-repository.port';
import { SeriesSuggestionsRepository } from '../ports/series-suggestions-repository.port';
import { TelemetryRecorderPort } from '../ports/telemetry-recorder.port';

export class ImportReadingHistoryUseCase {
  constructor(
    private readonly browserHistory: BrowserHistoryPort,
    private readonly scanRepository: ScanRepository,
    private readonly suggestionsRepository: SeriesSuggestionsRepository,
    private readonly crashReporter: CrashReporterPort,
    private readonly reportSettings: ReportSettingsRepository,
    private readonly telemetry: TelemetryRecorderPort,
  ) {}

  async execute(): Promise<void> {
    const visits = await this.browserHistory.findPagesVisitedSinceLastImport();
    const library = await this.scanRepository.load();
    const suggestions = await this.suggestionsRepository.load();
    const { sendsParseReports } = await this.reportSettings.load();
    for (const { page, readAt } of visits) {
      const parsedPage = parsePage(page, readAt, 'unknown');
      switch (parsedPage.kind) {
        case 'not-a-scan':
          break;
        case 'unparsed':
          this.telemetry.record(parseMissEvent(parsedPage.page));
          if (sendsParseReports) {
            this.crashReporter.reportUnparsedPage(parsedPage.page);
          }
          break;
        case 'reading': {
          const { reading } = parsedPage;
          switch (readingTrustOf(reading, library, suggestions).kind) {
            case 'trusted':
              library.recordReading(reading);
              break;
            case 'needs-confirmation':
              suggestions.suggest(reading, 'history');
              break;
            case 'ignored':
              break;
          }
        }
      }
    }
    await this.scanRepository.save(library);
    await this.suggestionsRepository.save(suggestions);
  }
}
