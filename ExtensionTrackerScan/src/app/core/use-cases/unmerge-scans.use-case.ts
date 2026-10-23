import { settleCover } from '../domain/cover';
import { ScanSnapshot } from '../domain/scan-library';
import { MergedScans } from '../domain/scan-merge';
import { ScanTitle } from '../domain/scan-title';
import { ChapterWatchRepository } from '../ports/chapter-watch-repository.port';
import { CoverRepository } from '../ports/cover-repository.port';
import { ScanRepository } from '../ports/scan-repository.port';

export class UnmergeScansUseCase {
  constructor(
    private readonly scanRepository: ScanRepository,
    private readonly coverRepository: CoverRepository,
    private readonly watchRepository: ChapterWatchRepository,
  ) {}

  async execute({ source, target }: MergedScans): Promise<ScanSnapshot[]> {
    const sourceTitle = ScanTitle.of(source.scan.title);
    const targetTitle = ScanTitle.of(target.scan.title);
    const library = await this.scanRepository.load();
    library.unmerge(target.scan, source.scan);
    const targetCover = target.cover;
    if (targetCover) {
      await this.coverRepository.update(targetTitle, () => targetCover);
    } else {
      await this.coverRepository.remove(targetTitle);
    }
    if (target.watch) {
      await this.watchRepository.save(targetTitle, target.watch);
    } else {
      await this.watchRepository.remove(targetTitle);
    }
    if (source.cover) {
      await this.coverRepository.update(sourceTitle, settleCover(source.cover));
    }
    if (source.watch) {
      await this.watchRepository.save(sourceTitle, source.watch);
    }
    await this.scanRepository.save(library);
    return library.snapshot();
  }
}
