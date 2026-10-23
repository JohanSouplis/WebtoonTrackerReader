import { settleCover } from '../domain/cover';
import { ScanSnapshot } from '../domain/scan-library';
import { ScanTitle } from '../domain/scan-title';
import { ChapterWatchRepository } from '../ports/chapter-watch-repository.port';
import { CoverRepository } from '../ports/cover-repository.port';
import { ScanRepository } from '../ports/scan-repository.port';
import { RemovedScan } from './delete-scan.use-case';

export class RestoreScanUseCase {
  constructor(
    private readonly scanRepository: ScanRepository,
    private readonly coverRepository: CoverRepository,
    private readonly watchRepository: ChapterWatchRepository,
  ) {}

  async execute({ scan, cover, watch }: RemovedScan): Promise<ScanSnapshot[]> {
    const title = ScanTitle.of(scan.title);
    const library = await this.scanRepository.load();
    library.reinstate(scan);
    if (cover) {
      await this.coverRepository.update(title, settleCover(cover));
    }
    if (watch) {
      await this.watchRepository.save(title, watch);
    }
    await this.scanRepository.save(library);
    return library.snapshot();
  }
}
