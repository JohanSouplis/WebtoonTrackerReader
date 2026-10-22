export interface CoverBackfillPort {
  backfillCovers(
    titles: readonly string[],
    onCoverSaved: () => void,
  ): Promise<void>;
}
