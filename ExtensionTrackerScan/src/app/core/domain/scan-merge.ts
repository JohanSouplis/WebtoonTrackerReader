import { ChapterWatch } from './chapter-watch';
import { Cover } from './cover';
import { ScanSnapshot } from './scan-library';

export type MergedScan = {
  readonly scan: ScanSnapshot;
  readonly cover?: Cover;
  readonly watch?: ChapterWatch;
};

export type MergedScans = {
  readonly source: MergedScan;
  readonly target: MergedScan;
};

export const mergedCoverAndWatchOf = ({
  source,
  target,
}: MergedScans): Omit<MergedScan, 'scan'> => {
  const [latest, earliest] =
    source.scan.readAt > target.scan.readAt
      ? [source, target]
      : [target, source];
  return {
    cover:
      [latest.cover, earliest.cover].find((cover) => cover?.kind === 'found') ??
      latest.cover ??
      earliest.cover,
    watch: latest.watch ?? earliest.watch,
  };
};
