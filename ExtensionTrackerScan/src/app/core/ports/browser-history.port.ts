import { VisitedPage } from '../domain/parsed-page';
import { ReadingOrigin } from '../domain/reading';

export type HistoryVisit = {
  readonly page: VisitedPage;
  readonly readAt: Date;
};

export interface BrowserHistoryPort {
  findVisitsNotYetImported(): Promise<HistoryVisit[]>;
  originOf(visit: HistoryVisit): Promise<ReadingOrigin>;
}
