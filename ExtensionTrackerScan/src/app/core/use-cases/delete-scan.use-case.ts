import { ScanSnapshot } from '../domain/scan-library';
import { ScanTitle } from '../domain/scan-title';
import { ChapterWatchRepository } from '../ports/chapter-watch-repository.port';
import { CoverRepository } from '../ports/cover-repository.port';
import { ScanRepository } from '../ports/scan-repository.port';

export class DeleteScanUseCase {
  constructor(
    private readonly scanRepository: ScanRepository,
    private readonly coverRepository: CoverRepository,
    private readonly watchRepository: ChapterWatchRepository,
  ) {}

  async execute(title: ScanTitle): Promise<ScanSnapshot[]> {
    const library = await this.scanRepository.load();
    library.remove(title);
    await this.coverRepository.remove(title);
    await this.watchRepository.remove(title);
    await this.scanRepository.save(library);
    return library.snapshot();
  }
}
