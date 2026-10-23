import { ScanSnapshot } from '../domain/scan-library';
import { MergedScans, mergedCoverAndWatchOf } from '../domain/scan-merge';
import { ScanTitle } from '../domain/scan-title';
import { ChapterWatchRepository } from '../ports/chapter-watch-repository.port';
import { CoverRepository } from '../ports/cover-repository.port';
import { ScanRepository } from '../ports/scan-repository.port';

export type ScanMerger = {
  readonly library: ScanSnapshot[];
  readonly merged: MergedScans;
};

export class MergeScansUseCase {
  constructor(
    private readonly scanRepository: ScanRepository,
    private readonly coverRepository: CoverRepository,
    private readonly watchRepository: ChapterWatchRepository,
  ) {}

  async execute(source: ScanTitle, target: ScanTitle): Promise<ScanMerger> {
    const library = await this.scanRepository.load();
    const sourceScan = library.snapshotOf(source);
    const targetScan = library.snapshotOf(target);
    library.merge(source, target);
    const covers = await this.coverRepository.find([source, target]);
    const watches = await this.watchRepository.find([source, target]);
    const merged: MergedScans = {
      source: {
        scan: sourceScan,
        cover: covers.get(source.value),
        watch: watches.get(source.value),
      },
      target: {
        scan: targetScan,
        cover: covers.get(target.value),
        watch: watches.get(target.value),
      },
    };
    const { cover, watch } = mergedCoverAndWatchOf(merged);
    await this.scanRepository.save(library);
    if (cover) {
      await this.coverRepository.update(target, () => cover);
    }
    if (watch) {
      await this.watchRepository.save(target, watch);
    }
    await this.coverRepository.remove(source);
    await this.watchRepository.remove(source);
    return { library: library.snapshot(), merged };
  }
}
