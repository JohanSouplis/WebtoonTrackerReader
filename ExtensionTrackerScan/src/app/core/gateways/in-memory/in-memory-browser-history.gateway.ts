import {
  BrowserHistoryPort,
  HistoryVisit,
} from '../../ports/browser-history.port';

export class InMemoryBrowserHistory implements BrowserHistoryPort {
  constructor(private visitsSinceLastImport: HistoryVisit[]) {}

  async findPagesVisitedSinceLastImport(): Promise<HistoryVisit[]> {
    const visits = this.visitsSinceLastImport;
    this.visitsSinceLastImport = [];
    return visits;
  }
}
