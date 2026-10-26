import { ReadingOrigin } from '../../domain/reading';
import {
  BrowserHistoryPort,
  HistoryVisit,
} from '../../ports/browser-history.port';

export type SyncedVisit = HistoryVisit & { readonly origin?: ReadingOrigin };

export class InMemoryBrowserHistory implements BrowserHistoryPort {
  private delivered = 0;

  constructor(private readonly visits: readonly SyncedVisit[]) {}

  async findVisitsNotYetImported(): Promise<HistoryVisit[]> {
    const visits = this.visits.slice(this.delivered);
    this.delivered = this.visits.length;
    return visits.map(({ page, readAt }) => ({ page, readAt }));
  }

  async originOf({ page, readAt }: HistoryVisit): Promise<ReadingOrigin> {
    return (
      this.visits.find(
        (visit) =>
          visit.page.url === page.url &&
          visit.readAt.getTime() === readAt.getTime(),
      )?.origin ?? 'unknown'
    );
  }
}
