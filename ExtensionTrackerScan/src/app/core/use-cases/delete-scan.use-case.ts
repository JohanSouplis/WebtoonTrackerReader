import { ChapterWatch } from '../domain/chapter-watch';
import { Cover } from '../domain/cover';
import { ScanSnapshot } from '../domain/scan-library';
import { ScanTitle } from '../domain/scan-title';
import { ChapterWatchRepository } from '../ports/chapter-watch-repository.port';
import { CoverRepository } from '../ports/cover-repository.port';
import { ScanRepository } from '../ports/scan-repository.port';

export type RemovedScan = {
  readonly scan: ScanSnapshot;
  readonly cover?: Cover;
  readonly watch?: ChapterWatch;
};

export type ScanRemoval = {
  readonly library: ScanSnapshot[];
  readonly removed: RemovedScan;
};

export class DeleteScanUseCase {
  constructor(
    private readonly scanRepository: ScanRepository,
    private readonly coverRepository: CoverRepository,
    private readonly watchRepository: ChapterWatchRepository,
  ) {}

  async execute(title: ScanTitle): Promise<ScanRemoval> {
    const library = await this.scanRepository.load();
    const scan = library.snapshotOf(title);
    library.remove(title);
    const cover = (await this.coverRepository.find([title])).get(title.value);
    const watch = (await this.watchRepository.find([title])).get(title.value);
    await this.coverRepository.remove(title);
    await this.watchRepository.remove(title);
    await this.scanRepository.save(library);
    return { library: library.snapshot(), removed: { scan, cover, watch } };
  }
}
