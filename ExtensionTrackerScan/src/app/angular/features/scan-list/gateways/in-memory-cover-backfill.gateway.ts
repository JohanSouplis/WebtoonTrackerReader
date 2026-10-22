import { CoverBackfillPort } from '../service/cover-backfill.port';

export class InMemoryCoverBackfill implements CoverBackfillPort {
  readonly requests: (readonly string[])[] = [];

  async backfillCovers(titles: readonly string[]): Promise<void> {
    this.requests.push(titles);
  }
}
