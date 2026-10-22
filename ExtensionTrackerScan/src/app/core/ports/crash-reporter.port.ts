import { VisitedPage } from '../domain/parsed-page';

export interface CrashReporterPort {
  reportUnparsedPage(page: VisitedPage): void;
}
