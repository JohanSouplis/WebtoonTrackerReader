import { VisitedPage } from '../domain/parsed-page';

export type HistoryVisit = {
  readonly page: VisitedPage;
  readonly readAt: Date;
};

export interface BrowserHistoryPort {
  findVisitsNotYetImported(): Promise<HistoryVisit[]>;
}
