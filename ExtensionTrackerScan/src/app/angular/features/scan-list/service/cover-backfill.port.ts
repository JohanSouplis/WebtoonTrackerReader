export interface CoverBackfillPort {
  backfillCovers(titles: readonly string[]): Promise<void>;
}
