import { parsePage } from '../domain/page-title-parser';
import { VisitedPage } from '../domain/parsed-page';
import { ClockPort } from '../ports/clock.port';
import { CrashReporterPort } from '../ports/crash-reporter.port';
import { ScanRepository } from '../ports/scan-repository.port';

export class RecordVisitedPageUseCase {
  constructor(
    private readonly scanRepository: ScanRepository,
    private readonly crashReporter: CrashReporterPort,
    private readonly clock: ClockPort,
  ) {}

  async execute(page: VisitedPage): Promise<void> {
    const parsedPage = parsePage(page, this.clock.now());
    switch (parsedPage.kind) {
      case 'not-a-scan':
        return;
      case 'unparsed':
        this.crashReporter.reportUnparsedPage(parsedPage.page);
        return;
      case 'reading': {
        const library = await this.scanRepository.load();
        library.recordReading(parsedPage.reading);
        await this.scanRepository.save(library);
      }
    }
  }
}
