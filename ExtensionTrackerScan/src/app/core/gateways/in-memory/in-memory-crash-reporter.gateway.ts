import { VisitedPage } from '../../domain/parsed-page';
import { CrashReporterPort } from '../../ports/crash-reporter.port';

export class InMemoryCrashReporter implements CrashReporterPort {
  readonly reportedPages: VisitedPage[] = [];

  reportUnparsedPage(page: VisitedPage): void {
    this.reportedPages.push(page);
  }
}
