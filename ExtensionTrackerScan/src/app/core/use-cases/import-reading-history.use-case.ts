import { parsePage } from '../domain/page-title-parser';
import { BrowserHistoryPort } from '../ports/browser-history.port';
import { CrashReporterPort } from '../ports/crash-reporter.port';
import { ScanRepository } from '../ports/scan-repository.port';

export class ImportReadingHistoryUseCase {
  constructor(
    private readonly browserHistory: BrowserHistoryPort,
    private readonly scanRepository: ScanRepository,
    private readonly crashReporter: CrashReporterPort,
  ) {}

  async execute(): Promise<void> {
    const visits = await this.browserHistory.findPagesVisitedSinceLastImport();
    const library = await this.scanRepository.load();
    for (const { page, readAt } of visits) {
      const parsedPage = parsePage(page, readAt);
      switch (parsedPage.kind) {
        case 'not-a-scan':
          break;
        case 'unparsed':
          this.crashReporter.reportUnparsedPage(parsedPage.page);
          break;
        case 'reading':
          library.recordReading(parsedPage.reading);
      }
    }
    await this.scanRepository.save(library);
  }
}
