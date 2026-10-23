import { parsePage } from '../domain/page-title-parser';
import { PageSignals } from '../domain/parsed-page';
import { seriesPageUrlOf } from '../domain/series-page';
import { ClockPort } from '../ports/clock.port';
import { CrashReporterPort } from '../ports/crash-reporter.port';
import { ReportSettingsRepository } from '../ports/report-settings-repository.port';
import { ScanRepository } from '../ports/scan-repository.port';

export class RecordVisitedPageUseCase {
  constructor(
    private readonly scanRepository: ScanRepository,
    private readonly crashReporter: CrashReporterPort,
    private readonly reportSettings: ReportSettingsRepository,
    private readonly clock: ClockPort,
  ) {}

  async execute(page: PageSignals): Promise<void> {
    const parsedPage = parsePage(page, this.clock.now());
    switch (parsedPage.kind) {
      case 'not-a-scan':
        return;
      case 'unparsed':
        if ((await this.reportSettings.load()).sendsParseReports) {
          this.crashReporter.reportUnparsedPage(parsedPage.page);
        }
        return;
      case 'reading': {
        const library = await this.scanRepository.load();
        const { reading } = parsedPage;
        library.recordReading({
          ...reading,
          seriesUrl: seriesPageUrlOf(page, reading.title),
        });
        await this.scanRepository.save(library);
      }
    }
  }
}
